"use client";

import { useState, useMemo } from "react";

/* ─── helpers ─── */

function ipToNum(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    num = (num << 8) | n;
  }
  return num >>> 0;
}

function numToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
}

function cidrToMask(cidr: number): number {
  return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}

function maskToCidr(mask: number): number {
  let bits = 0;
  let m = mask;
  while (m & 0x80000000) {
    bits++;
    m = (m << 1) >>> 0;
  }
  return bits;
}

function subnetCalc(ip: string, cidr: number) {
  const ipNum = ipToNum(ip);
  if (ipNum === null) return null;
  const mask = cidrToMask(cidr);
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2;
  const firstUsable = cidr >= 31 ? network : (network + 1) >>> 0;
  const lastUsable = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;

  return {
    network: numToIp(network),
    broadcast: numToIp(broadcast),
    mask: numToIp(mask),
    firstUsable: numToIp(firstUsable),
    lastUsable: numToIp(lastUsable),
    totalHosts,
    usableHosts,
    cidr,
  };
}

function isInSameSubnet(ip1: string, ip2: string, cidr: number): boolean | null {
  const n1 = ipToNum(ip1);
  const n2 = ipToNum(ip2);
  if (n1 === null || n2 === null) return null;
  const mask = cidrToMask(cidr);
  return ((n1 & mask) >>> 0) === ((n2 & mask) >>> 0);
}

/* ─── common BACnet subnet presets ─── */
const PRESETS = [
  { label: "Typical BACnet /24", ip: "192.168.1.0", cidr: 24 },
  { label: "BACnet MSTP trunk /24", ip: "10.10.1.0", cidr: 24 },
  { label: "Small closet /28", ip: "192.168.1.0", cidr: 28 },
  { label: "Building segment /22", ip: "10.0.0.0", cidr: 22 },
  { label: "Point-to-point /30", ip: "172.16.0.0", cidr: 30 },
];

/* ─── VLAN reference data ─── */
const VLAN_NOTES = [
  {
    title: "BACnet/IP Port",
    content: "UDP 47808 (0xBAC0). Ensure firewall rules allow this port between all BACnet devices and BBMDs. Some devices also use 47809 for foreign device registration.",
  },
  {
    title: "Dedicated BACnet VLAN",
    content: "Best practice: isolate BACnet/IP on its own VLAN (e.g., VLAN 100). This prevents broadcast storms from disrupting IT traffic and keeps BACnet Who-Is/I-Am broadcasts contained.",
  },
  {
    title: "VLAN Tagging (802.1Q)",
    content: "Controller ports are typically UNTAGGED (access mode) on the BACnet VLAN. Trunk ports between switches carry the BACnet VLAN as a TAGGED VLAN. Verify with 'show vlan brief' on Cisco or equivalent.",
  },
  {
    title: "BBMD (BACnet Broadcast Management Device)",
    content: "Required when BACnet devices span multiple subnets. Each subnet needs exactly ONE BBMD. BBMDs maintain a Broadcast Distribution Table (BDT) pointing to each other. Misconfigured BBMDs are the #1 cause of cross-subnet BACnet failures.",
  },
  {
    title: "Foreign Device Registration",
    content: "Laptops and temporary workstations should register as Foreign Devices to a BBMD rather than being added to the BDT. FDR uses a time-to-live and must be renewed periodically.",
  },
  {
    title: "IP Helpers / UDP Forwarding",
    content: "Alternative to BBMD: configure 'ip helper-address' on router interfaces to forward UDP 47808 broadcasts between subnets. Simpler but less standard. Not all routers support it well for BACnet.",
  },
  {
    title: "Multiport Devices",
    content: "Some controllers (Tridium JACE, Distech EC-BOS) have multiple Ethernet ports. Ensure the BACnet/IP interface is on the correct port/VLAN, not the management interface.",
  },
];

/* ─── Decision tree ─── */
interface TreeNode {
  id: string;
  question: string;
  detail?: string;
  yes?: string;
  no?: string;
  fix?: string;
}

const DECISION_TREE: TreeNode[] = [
  {
    id: "start",
    question: "Can you ping the device's IP address?",
    detail: "Open CMD/Terminal. Type: ping [device IP]. Wait for reply.",
    yes: "ping_ok",
    no: "no_ping",
  },
  {
    id: "ping_ok",
    question: "Can you see the device in your BACnet browser/explorer?",
    detail: "Open YABE, BACnet Explorer, or your front-end's device list. Run a Who-Is.",
    yes: "bacnet_ok",
    no: "no_bacnet",
  },
  {
    id: "bacnet_ok",
    question: "Can you read points/objects from the device?",
    detail: "Try reading a known Analog Input or Binary Value.",
    yes: "done_ok",
    no: "read_fail",
  },
  {
    id: "done_ok",
    question: "",
    fix: "Your BACnet/IP connection is working correctly. If you're having intermittent issues, check for duplicate Device Instance numbers (very common) or network congestion.",
  },
  {
    id: "read_fail",
    question: "",
    fix: "Device responds to Who-Is but won't let you read objects. Check: (1) Device Instance number is correct, (2) No APDU timeout — try increasing from 3000ms to 10000ms, (3) Device might be overloaded — reduce polling rate, (4) Check if device requires authentication (BACnet/SC).",
  },
  {
    id: "no_bacnet",
    question: "Is the device configured for BACnet/IP (not BACnet MSTP)?",
    detail: "Check device configuration. MSTP devices connect via RS-485, not Ethernet. You need a BACnet router to bridge MSTP to IP.",
    yes: "check_port",
    no: "mstp_issue",
  },
  {
    id: "mstp_issue",
    question: "",
    fix: "This device uses BACnet MSTP (serial RS-485), not BACnet/IP. You need a BACnet router (like a JACE, Babel Buster, or dedicated router) to translate MSTP↔IP. Connect to the router's IP interface instead.",
  },
  {
    id: "check_port",
    question: "Is your workstation registered as a Foreign Device to a BBMD?",
    detail: "If your laptop is on a different subnet than the device, you must register as a Foreign Device in your BACnet explorer settings. Enter the BBMD IP and a TTL (e.g., 300 seconds).",
    yes: "check_instance",
    no: "fdr_fix",
  },
  {
    id: "fdr_fix",
    question: "",
    fix: "Register as a Foreign Device: In your BACnet explorer, find the BBMD/Foreign Device settings. Enter the BBMD's IP address and set TTL to 300 seconds. If you're on the SAME subnet as the device, this isn't needed — check that UDP 47808 isn't blocked by your laptop's firewall (Windows Defender, etc.).",
  },
  {
    id: "check_instance",
    question: "Are there duplicate Device Instance numbers on the network?",
    detail: "Run a global Who-Is and check for two devices reporting the same Instance number. This is extremely common after cloning/replacing controllers.",
    yes: "dup_fix",
    no: "port_block",
  },
  {
    id: "dup_fix",
    question: "",
    fix: "Duplicate Device Instance numbers cause unpredictable behavior — one device shadows the other. Fix: Change one device's Instance number to a unique value. Convention: use last octet of IP + building/floor prefix (e.g., Building 1, Floor 2, Device .45 → Instance 10245).",
  },
  {
    id: "port_block",
    question: "",
    fix: "UDP 47808 may be blocked. Check: (1) Laptop firewall — add inbound+outbound rule for UDP 47808, (2) Switch ACLs, (3) Try Wireshark — filter 'udp.port == 47808' to see if packets are being sent/received. If packets go out but nothing comes back, it's likely a firewall or VLAN issue on the switch side.",
  },
  {
    id: "no_ping",
    question: "Is your laptop on the same subnet as the device?",
    detail: "Compare your IP (ipconfig/ifconfig) and subnet mask with the device's. Use the Subnet Calculator tab to verify.",
    yes: "same_subnet",
    no: "diff_subnet",
  },
  {
    id: "diff_subnet",
    question: "",
    fix: "You're on a different subnet. Options: (1) Change your laptop's IP to the device's subnet (quickest for commissioning), (2) Ensure a gateway/router connects both subnets and routes are configured, (3) If using a managed switch, check that the correct VLAN is assigned to your port — run 'show vlan brief' or check with IT.",
  },
  {
    id: "same_subnet",
    question: "Is the Ethernet cable connected and showing link lights?",
    detail: "Check both ends — device and switch/laptop. Amber = link, Green = activity. No lights = bad cable or dead port.",
    yes: "link_ok",
    no: "cable_fix",
  },
  {
    id: "cable_fix",
    question: "",
    fix: "No link light means physical layer issue: (1) Try a different cable, (2) Try a different switch port, (3) Check if the device has separate ports for BACnet vs. service/config — you may be plugged into the wrong port, (4) Some controllers need PoE — verify switch provides power, (5) Hard reset the device if nothing else works.",
  },
  {
    id: "link_ok",
    question: "Can you ping the device's gateway (if one is configured)?",
    detail: "Check the device's gateway setting. Ping that gateway from your laptop.",
    yes: "gw_ok",
    no: "gw_fix",
  },
  {
    id: "gw_ok",
    question: "",
    fix: "Link is up, same subnet, gateway reachable, but device won't respond to ping. Check: (1) Device may have ping/ICMP disabled — some controllers do this by default, (2) IP conflict — another device may have the same IP (use 'arp -a' to check), (3) Device may not have finished booting — some controllers take 2-3 minutes after power-up, (4) Try ARP: 'arp -d [device IP]' then ping again.",
  },
  {
    id: "gw_fix",
    question: "",
    fix: "Gateway unreachable suggests a VLAN or routing issue: (1) Verify your port is on the correct VLAN — ask the network team or check switch config, (2) Gateway IP might be wrong in the device config — verify against network documentation, (3) If no managed switch, check that you're not going through a router that's filtering traffic.",
  },
];

/* ─── tabs ─── */
const TABS = ["Subnet Calc", "Gateway Check", "VLAN Reference", "Can't Ping?", "MSTP"] as const;
type Tab = (typeof TABS)[number];

/* ─── components ─── */

function ResultRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className={`text-sm font-mono font-medium ${accent ? "text-[var(--primary)]" : ""}`}>{value}</span>
    </div>
  );
}

function SubnetCalcTab() {
  const [ip, setIp] = useState("192.168.1.100");
  const [cidr, setCidr] = useState(24);

  const result = useMemo(() => subnetCalc(ip, cidr), [ip, cidr]);

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-2">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setIp(p.ip); setCidr(p.cidr); }}
              className="px-2.5 py-1.5 text-xs rounded-md bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/80 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">IP Address</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.100"
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">CIDR / Prefix</label>
          <select
            value={cidr}
            onChange={(e) => setCidr(parseInt(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).reverse().map((c) => (
              <option key={c} value={c}>
                /{c} — {numToIp(cidrToMask(c))} ({Math.pow(2, 32 - c)} IPs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <ResultRow label="Network" value={result.network} accent />
          <ResultRow label="Broadcast" value={result.broadcast} />
          <ResultRow label="Subnet Mask" value={result.mask} />
          <ResultRow label="First Usable" value={result.firstUsable} accent />
          <ResultRow label="Last Usable" value={result.lastUsable} accent />
          <ResultRow label="Usable Hosts" value={result.usableHosts.toLocaleString()} />
          <ResultRow label="CIDR Notation" value={`${result.network}/${result.cidr}`} />
        </div>
      )}

      {!result && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
          Enter a valid IPv4 address to see subnet details.
        </div>
      )}

      {/* BACnet note */}
      <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
        <span className="font-semibold text-[var(--primary)]">BACnet Tip:</span> Most BACnet/IP installations use /24 subnets. If you have more than 200 devices on one subnet, consider splitting into /25 segments with a BBMD on each side.
      </div>
    </div>
  );
}

function GatewayCheckTab() {
  const [deviceIp, setDeviceIp] = useState("192.168.1.100");
  const [gatewayIp, setGatewayIp] = useState("192.168.1.1");
  const [cidr, setCidr] = useState(24);

  const sameSubnet = useMemo(() => isInSameSubnet(deviceIp, gatewayIp, cidr), [deviceIp, gatewayIp, cidr]);
  const deviceSubnet = useMemo(() => subnetCalc(deviceIp, cidr), [deviceIp, cidr]);
  const gatewaySubnet = useMemo(() => subnetCalc(gatewayIp, cidr), [gatewayIp, cidr]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Device IP</label>
          <input
            type="text"
            value={deviceIp}
            onChange={(e) => setDeviceIp(e.target.value)}
            placeholder="192.168.1.100"
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Gateway IP</label>
          <input
            type="text"
            value={gatewayIp}
            onChange={(e) => setGatewayIp(e.target.value)}
            placeholder="192.168.1.1"
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Subnet Mask</label>
          <select
            value={cidr}
            onChange={(e) => setCidr(parseInt(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {[30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 16].map((c) => (
              <option key={c} value={c}>
                /{c} — {numToIp(cidrToMask(c))}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result */}
      {sameSubnet !== null && (
        <div className={`rounded-lg border p-4 ${
          sameSubnet
            ? "border-green-500/30 bg-green-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{sameSubnet ? "✅" : "❌"}</span>
            <span className={`font-semibold text-sm ${sameSubnet ? "text-green-400" : "text-red-400"}`}>
              {sameSubnet
                ? "Gateway is on the same subnet — configuration looks correct"
                : "Gateway is NOT on the same subnet — this device cannot reach its gateway"}
            </span>
          </div>
          {!sameSubnet && deviceSubnet && gatewaySubnet && (
            <div className="mt-3 space-y-1 text-xs text-[var(--muted-foreground)]">
              <p>Device network: <span className="font-mono text-[var(--foreground)]">{deviceSubnet.network}/{cidr}</span></p>
              <p>Gateway network: <span className="font-mono text-[var(--foreground)]">{gatewaySubnet.network}/{cidr}</span></p>
              <p className="mt-2 text-red-400">Fix: Change the device&apos;s gateway to an IP within {deviceSubnet.network}/{cidr}, or change the device&apos;s IP to be on the same subnet as the gateway.</p>
            </div>
          )}
          {sameSubnet && deviceSubnet && (
            <div className="mt-2 text-xs text-[var(--muted-foreground)]">
              Both are on network <span className="font-mono text-[var(--foreground)]">{deviceSubnet.network}/{cidr}</span>
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h4 className="text-sm font-semibold mb-3">Gateway Sanity Checklist</h4>
        <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
          {[
            "Gateway IP is on the same subnet as the device",
            "Gateway IP is not the same as the device IP",
            "Gateway IP is not the broadcast address",
            "Gateway actually exists (ping it from your laptop)",
            "If no gateway needed (flat network), leave gateway as 0.0.0.0",
            "BACnet/IP uses UDP 47808 — ensure gateway routes this port",
          ].map((check, i) => (
            <label key={i} className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" />
              <span>{check}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function VlanReferenceTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
        <span className="font-semibold text-[var(--primary)]">Key Ports:</span>{" "}
        BACnet/IP = UDP <span className="font-mono text-[var(--foreground)]">47808</span> (0xBAC0) |
        BACnet/SC = TCP <span className="font-mono text-[var(--foreground)]">443</span> (TLS) |
        Foreign Device = UDP <span className="font-mono text-[var(--foreground)]">47808</span> (same port, different message type)
      </div>

      {VLAN_NOTES.map((note) => (
        <button
          key={note.title}
          onClick={() => setExpanded(expanded === note.title ? null : note.title)}
          className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--primary)]/30"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">{note.title}</h4>
            <span className="text-[var(--muted-foreground)] text-xs">{expanded === note.title ? "▲" : "▼"}</span>
          </div>
          {expanded === note.title && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed">{note.content}</p>
          )}
        </button>
      ))}

      {/* Quick VLAN config example */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h4 className="text-sm font-semibold mb-2">Typical Switch Port Config (Cisco IOS)</h4>
        <pre className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--background)] rounded p-3 overflow-x-auto leading-relaxed">
{`! Controller port — access mode
interface GigabitEthernet0/1
  switchport mode access
  switchport access vlan 100
  description BACnet-Controller-AHU1

! Uplink — trunk mode
interface GigabitEthernet0/24
  switchport mode trunk
  switchport trunk allowed vlan 1,100,200
  description Trunk-to-MDF`}
        </pre>
      </div>
    </div>
  );
}

function CantPingTab() {
  const [path, setPath] = useState<string[]>(["start"]);

  const currentId = path[path.length - 1];
  const currentNode = DECISION_TREE.find((n) => n.id === currentId);

  const handleAnswer = (nextId: string) => {
    setPath([...path, nextId]);
  };

  const handleBack = () => {
    if (path.length > 1) {
      setPath(path.slice(0, -1));
    }
  };

  const handleReset = () => {
    setPath(["start"]);
  };

  if (!currentNode) return null;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span>Step {path.length}</span>
        <div className="flex-1 h-1 rounded bg-[var(--accent)] overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded transition-all duration-300"
            style={{ width: `${Math.min((path.length / 6) * 100, 100)}%` }}
          />
        </div>
        {path.length > 1 && (
          <button onClick={handleBack} className="text-[var(--primary)] hover:underline">
            ← Back
          </button>
        )}
        {path.length > 1 && (
          <button onClick={handleReset} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Reset
          </button>
        )}
      </div>

      {/* Current node */}
      {currentNode.fix ? (
        /* Fix / answer node */
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <span className="font-semibold text-sm text-green-400">Diagnosis</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{currentNode.fix}</p>
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Over
          </button>
        </div>
      ) : (
        /* Question node */
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h4 className="text-sm font-semibold mb-1">{currentNode.question}</h4>
          {currentNode.detail && (
            <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">{currentNode.detail}</p>
          )}
          <div className="flex gap-3">
            {currentNode.yes && (
              <button
                onClick={() => handleAnswer(currentNode.yes!)}
                className="flex-1 py-2.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors"
              >
                Yes
              </button>
            )}
            {currentNode.no && (
              <button
                onClick={() => handleAnswer(currentNode.no!)}
                className="flex-1 py-2.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors"
              >
                No
              </button>
            )}
          </div>
        </div>
      )}

      {/* Path breadcrumb */}
      {path.length > 1 && (
        <div className="text-xs text-[var(--muted-foreground)]">
          <span className="font-semibold">Path:</span>{" "}
          {path.map((id, i) => {
            const node = DECISION_TREE.find((n) => n.id === id);
            if (!node) return null;
            const label = node.fix ? "💡 Fix" : node.question?.slice(0, 30) + "...";
            return (
              <span key={id}>
                {i > 0 && " → "}
                <button
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {label}
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── MSTP Planner ─── */

const BAUD_RATES = [
  { baud: 9600, maxCable: "4000 ft (1200m)", maxDevices: 32, notes: "Default for most controllers. Safest for long runs." },
  { baud: 19200, maxCable: "4000 ft (1200m)", maxDevices: 32, notes: "Good balance of speed and reliability." },
  { baud: 38400, maxCable: "4000 ft (1200m)", maxDevices: 32, notes: "Common for Tridium, Distech. Reduce cable length if errors occur." },
  { baud: 76800, maxCable: "2000 ft (600m)", maxDevices: 32, notes: "High speed — shorter cable runs. Less common in BAS." },
];

const TOKEN_TIMING = [
  { devices: 5, baud: 38400, maxMaster: 5, tokenRotation: "~50ms", pollRate: "~200ms", notes: "Fast — ideal for small trunks" },
  { devices: 10, baud: 38400, maxMaster: 10, tokenRotation: "~100ms", pollRate: "~400ms", notes: "Typical VAV trunk" },
  { devices: 15, baud: 38400, maxMaster: 15, tokenRotation: "~150ms", pollRate: "~600ms", notes: "Getting busy — watch for timeouts" },
  { devices: 20, baud: 38400, maxMaster: 20, tokenRotation: "~200ms", pollRate: "~800ms", notes: "Near practical limit at 38400" },
  { devices: 25, baud: 38400, maxMaster: 25, tokenRotation: "~250ms", pollRate: "~1.0s", notes: "May need to split trunk" },
  { devices: 32, baud: 38400, maxMaster: 32, tokenRotation: "~320ms", pollRate: "~1.3s", notes: "Max spec — expect slow polling" },
  { devices: 10, baud: 9600, maxMaster: 10, tokenRotation: "~400ms", pollRate: "~1.6s", notes: "Slow — avoid if possible at 9600" },
  { devices: 10, baud: 76800, maxMaster: 10, tokenRotation: "~50ms", pollRate: "~200ms", notes: "Fast at 76800 — short cables only" },
];

const COLLISION_CHECKLIST = [
  { id: "baud", label: "All devices on this trunk are set to the SAME baud rate", detail: "Even one mismatched device will cause constant collisions. Check every device, including routers." },
  { id: "maxmaster", label: "Max Master is set correctly on ALL master devices", detail: "Max Master must be ≥ the highest MAC address on the trunk. Set it to the exact highest MAC for best performance — don't leave it at the default 127." },
  { id: "duplicate", label: "No duplicate MAC addresses on the trunk", detail: "Two devices with the same MAC = guaranteed collisions. Use the address planner above to track assignments." },
  { id: "termination", label: "RS-485 bus is terminated at BOTH ends (and only both ends)", detail: "120Ω termination resistor at each end of the trunk. Missing termination = signal reflections. Extra termination in the middle = signal attenuation." },
  { id: "polarity", label: "RS-485 wiring polarity is consistent (+ to +, − to −)", detail: "Swapped polarity on even one device will cause it to corrupt the bus. Use a scope or multimeter to verify." },
  { id: "stub", label: "No long stub/spur wires off the main trunk", detail: "MSTP is a daisy-chain bus, NOT a star topology. Stubs > 6 ft cause reflections. Home-run each device on the trunk in series." },
  { id: "shield", label: "Shielded cable with shield grounded at ONE end only", detail: "Ground the shield at the controller/router end. Grounding at both ends creates a ground loop that injects noise." },
  { id: "power", label: "RS-485 bus is not run alongside high-voltage wiring", detail: "Keep MSTP cable at least 12 inches from 120V/277V wiring. Use separate conduit or tray." },
  { id: "router", label: "BACnet router is device MAC 0 or lowest MAC on trunk", detail: "The router should hold the token first for fastest routing. Convention: MAC 0 = router, MAC 1+ = controllers." },
  { id: "maxinfo", label: "Max Info Frames is set appropriately (default: 1)", detail: "Max Info Frames controls how many messages a device can send per token pass. Default 1 is usually fine. Increase to 5 on routers for better throughput." },
];

function MstpPlannerTab() {
  const [highestMac, setHighestMac] = useState(10);
  const [deviceCount, setDeviceCount] = useState(10);
  const [section, setSection] = useState<"planner" | "baud" | "timing" | "collisions">("planner");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recommendedMaxMaster = highestMac;
  const allChecked = checkedItems.size === COLLISION_CHECKLIST.length;

  return (
    <div className="space-y-4">
      {/* Section toggle */}
      <div className="flex gap-1 flex-wrap">
        {([
          ["planner", "Address Plan"],
          ["baud", "Baud & Wiring"],
          ["timing", "Token Timing"],
          ["collisions", "Collision Check"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              section === key
                ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--accent)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Address Planner ─── */}
      {section === "planner" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
            <span className="font-semibold text-[var(--primary)]">MSTP Addressing:</span>{" "}
            MAC <span className="font-mono text-[var(--foreground)]">0–127</span> = Master devices (controllers, routers).
            MAC <span className="font-mono text-[var(--foreground)]">128–254</span> = Slave devices (sensors, actuators).
            MAC <span className="font-mono text-[var(--foreground)]">255</span> = Broadcast (reserved).
          </div>

          {/* Max Masters Calculator */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
            <h4 className="text-sm font-semibold">Max Master Calculator</h4>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Highest MAC address on this trunk</label>
              <input
                type="number"
                min={0}
                max={127}
                value={highestMac}
                onChange={(e) => setHighestMac(Math.min(127, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div className={`rounded-lg p-3 ${
              recommendedMaxMaster <= 31 ? "bg-green-500/5 border border-green-500/20" : "bg-yellow-500/5 border border-yellow-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{recommendedMaxMaster <= 31 ? "✅" : "⚠️"}</span>
                <div>
                  <p className="text-sm font-semibold">Set Max Master = <span className="font-mono text-[var(--primary)]">{recommendedMaxMaster}</span></p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {recommendedMaxMaster <= 10
                      ? "Excellent — fast token rotation, minimal overhead."
                      : recommendedMaxMaster <= 20
                      ? "Good — standard trunk size. Token rotation will be reasonable."
                      : recommendedMaxMaster <= 31
                      ? "Acceptable — consider splitting into two trunks if polling is slow."
                      : "High — token must poll MACs 0 through " + recommendedMaxMaster + ". Expect slower response times."}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              <strong>Why it matters:</strong> MSTP polls every MAC from 0 to Max Master looking for devices.
              Setting Max Master to 127 (default on many devices) means the token checks 128 addresses even if you only have 5 devices — wasting ~90% of bandwidth on empty polls.
            </p>
          </div>

          {/* Address Map */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h4 className="text-sm font-semibold mb-2">Master Address Map (MAC 0–31)</h4>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">Common range for BAS trunks. MAC 0 is typically the router.</p>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 32 }, (_, i) => (
                <div
                  key={i}
                  className={`text-center py-1.5 rounded text-xs font-mono ${
                    i === 0
                      ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
                      : i <= highestMac
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-[var(--accent)] text-[var(--muted-foreground)]"
                  }`}
                  title={i === 0 ? "Router" : i <= highestMac ? "Active master" : "Available"}
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--primary)]/20 border border-[var(--primary)]/30 inline-block" /> Router</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/10 border border-green-500/20 inline-block" /> Active</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--accent)] inline-block" /> Available</span>
            </div>
          </div>

          {/* Slave range note */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h4 className="text-sm font-semibold mb-2">Slave Devices (MAC 128–254)</h4>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Slave devices don&apos;t participate in token passing — they only respond when polled by a master.
              Common slaves: zone sensors, I/O expanders, VAV actuators. Slave MAC addresses do NOT affect Max Master setting.
              Many modern &quot;slave&quot; devices (like Distech EC-Smart-Vue sensors) actually operate as masters — check manufacturer docs.
            </p>
          </div>
        </div>
      )}

      {/* ─── Baud & Wiring ─── */}
      {section === "baud" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="p-3 border-b border-[var(--border)]">
              <h4 className="text-sm font-semibold">Baud Rate Reference</h4>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {BAUD_RATES.map((b) => (
                <div key={b.baud} className="p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-semibold text-[var(--primary)]">{b.baud.toLocaleString()}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">Max {b.maxDevices} devices</span>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Max cable: <span className="font-mono text-[var(--foreground)]">{b.maxCable}</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">{b.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h4 className="text-sm font-semibold mb-3">Wiring Best Practices</h4>
            <div className="space-y-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
              <p><strong className="text-[var(--foreground)]">Cable:</strong> 22 AWG shielded twisted pair (STP). Belden 9841 or equivalent. One twisted pair for data (+ and −), shield connected at one end only.</p>
              <p><strong className="text-[var(--foreground)]">Topology:</strong> Daisy-chain ONLY. No stars, no tees, no branches. Each device connects in series along the trunk.</p>
              <p><strong className="text-[var(--foreground)]">Termination:</strong> 120Ω resistor across + and − at EACH END of the trunk. Most controllers have a built-in termination jumper — enable it on the first and last device only.</p>
              <p><strong className="text-[var(--foreground)]">Bias:</strong> Some trunks need bias resistors (pull + to Vcc, pull − to GND) to hold the bus idle state. Most modern controllers have this built-in. Enable on the router if available.</p>
              <p><strong className="text-[var(--foreground)]">Grounding:</strong> Ground the shield at the controller/head-end only. Never ground both ends — creates a ground loop.</p>
            </div>
          </div>

          <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
            <span className="font-semibold text-[var(--primary)]">Field Tip:</span>{" "}
            If you&apos;re getting intermittent comm losses, try reducing baud from 38400 to 19200 before re-wiring.
            A lower baud rate is more tolerant of cable issues and noise. You can always increase later once the trunk is stable.
          </div>
        </div>
      )}

      {/* ─── Token Timing ─── */}
      {section === "timing" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
            <span className="font-semibold text-[var(--primary)]">Token Passing:</span>{" "}
            MSTP uses a token ring over RS-485. The token visits each master MAC from 0 to Max Master.
            Each device gets one chance to send per token rotation. More devices = slower polling.
          </div>

          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Number of devices on trunk</label>
            <input
              type="number"
              min={1}
              max={32}
              value={deviceCount}
              onChange={(e) => setDeviceCount(Math.min(32, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          {/* Computed estimates */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h4 className="text-sm font-semibold mb-3">Estimated Timing @ 38400 baud</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)]">Token Rotation</span>
                <span className="text-xs font-mono font-medium">~{(deviceCount * 10).toLocaleString()}ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)]">Effective Poll Rate</span>
                <span className="text-xs font-mono font-medium">~{(deviceCount * 40).toLocaleString()}ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)]">Points per Second (est.)</span>
                <span className="text-xs font-mono font-medium">~{Math.round(1000 / (deviceCount * 40) * deviceCount * 5)} pts/s</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-[var(--muted-foreground)]">Recommended Max Master</span>
                <span className="text-xs font-mono font-medium text-[var(--primary)]">{deviceCount}</span>
              </div>
            </div>
          </div>

          {/* Reference table */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="p-3 border-b border-[var(--border)]">
              <h4 className="text-sm font-semibold">Common Configurations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <th className="px-3 py-2 text-left font-medium">Devices</th>
                    <th className="px-3 py-2 text-left font-medium">Baud</th>
                    <th className="px-3 py-2 text-left font-medium">Token</th>
                    <th className="px-3 py-2 text-left font-medium">Poll</th>
                    <th className="px-3 py-2 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {TOKEN_TIMING.map((t, i) => (
                    <tr key={i} className={t.devices === deviceCount ? "bg-[var(--primary)]/5" : ""}>
                      <td className="px-3 py-2 font-mono">{t.devices}</td>
                      <td className="px-3 py-2 font-mono">{t.baud.toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono">{t.tokenRotation}</td>
                      <td className="px-3 py-2 font-mono">{t.pollRate}</td>
                      <td className="px-3 py-2 text-[var(--muted-foreground)]">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h4 className="text-sm font-semibold mb-2">Timing Formulas</h4>
            <div className="space-y-2 text-xs text-[var(--muted-foreground)] font-mono leading-relaxed bg-[var(--background)] rounded p-3">
              <p>Token Rotation ≈ Max_Master × 10ms (at 38400 baud)</p>
              <p>Token Rotation ≈ Max_Master × 40ms (at 9600 baud)</p>
              <p>Poll Rate ≈ Token_Rotation × 4 (typical BACnet stack)</p>
              <p>Max_Info_Frames = 1 (default) → 1 msg per token pass</p>
              <p>Tusage_timeout = 20ms (how long to wait for response)</p>
              <p>Treply_timeout = 255ms (max wait for poll response)</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Collision Checklist ─── */}
      {section === "collisions" && (
        <div className="space-y-4">
          <div className={`rounded-lg p-3 text-xs leading-relaxed ${
            allChecked
              ? "bg-green-500/5 border border-green-500/20 text-green-400"
              : "bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-[var(--muted-foreground)]"
          }`}>
            {allChecked
              ? "✅ All checks passed — your MSTP trunk configuration looks solid."
              : `Checked ${checkedItems.size} of ${COLLISION_CHECKLIST.length} items. Verify each item on-site.`}
          </div>

          <div className="space-y-2">
            {COLLISION_CHECKLIST.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`w-full text-left rounded-lg border p-3.5 transition-colors ${
                  checkedItems.has(item.id)
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                    checkedItems.has(item.id)
                      ? "bg-green-500 text-white"
                      : "border border-[var(--border)] text-transparent"
                  }`}>
                    {checkedItems.has(item.id) ? "✓" : ""}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${checkedItems.has(item.id) ? "text-green-400" : ""}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setCheckedItems(new Set())}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Reset checklist
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── main ─── */

export default function BACnetCalculator() {
  const [tab, setTab] = useState<Tab>("Subnet Calc");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Subnet Calc" && <SubnetCalcTab />}
      {tab === "Gateway Check" && <GatewayCheckTab />}
      {tab === "VLAN Reference" && <VlanReferenceTab />}
      {tab === "Can't Ping?" && <CantPingTab />}
      {tab === "MSTP" && <MstpPlannerTab />}
    </div>
  );
}
