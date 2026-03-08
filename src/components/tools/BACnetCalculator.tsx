"use client";

import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

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

function maskToCidr(mask: number): number | null {
  let bits = 0;
  let m = mask;
  let seenZero = false;
  for (let i = 31; i >= 0; i--) {
    if (m & (1 << i)) {
      if (seenZero) return null; // non-contiguous
      bits++;
    } else {
      seenZero = true;
    }
  }
  return bits;
}

function parseMask(input: string): number | null {
  const trimmed = input.trim();
  // CIDR notation
  if (/^\/?\d{1,2}$/.test(trimmed)) {
    const n = parseInt(trimmed.replace("/", ""), 10);
    if (n >= 0 && n <= 32) return n;
    return null;
  }
  // Dotted notation
  const num = ipToNum(trimmed);
  if (num === null) return null;
  return maskToCidr(num);
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
    networkNum: network,
    broadcast: numToIp(broadcast),
    broadcastNum: broadcast,
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

/* BACnet constants */
const BACNET_DEFAULT_PORT = 47808;
const BACNET_MAX_INSTANCE = 4194303; // 2^22 - 1
const BACNET_MAX_NETWORK = 65534; // 65535 = broadcast
const BACNET_BROADCAST_NETWORK = 65535;

/* ═══════════════════════════════════════════════════════
   DIAGNOSTIC ENGINE
   ═══════════════════════════════════════════════════════ */

type DiagLevel = "valid" | "info" | "warning" | "error";

interface Diagnostic {
  level: DiagLevel;
  title: string;
  detail: string;
}

const DIAG_STYLES: Record<DiagLevel, { border: string; bg: string; text: string; icon: string }> = {
  valid:   { border: "border-emerald-500/30", bg: "bg-emerald-500/5",  text: "text-emerald-700 dark:text-emerald-400", icon: "check" },
  info:    { border: "border-blue-500/30",    bg: "bg-blue-500/5",     text: "text-blue-700 dark:text-blue-400",       icon: "info" },
  warning: { border: "border-amber-500/30",   bg: "bg-amber-500/5",    text: "text-amber-700 dark:text-amber-400",     icon: "warn" },
  error:   { border: "border-red-500/30",     bg: "bg-red-500/5",      text: "text-red-700 dark:text-red-400",         icon: "error" },
};

function DiagIcon({ type }: { type: string }) {
  if (type === "check") return <span className="text-base leading-none">&#10003;</span>;
  if (type === "info") return <span className="text-base font-bold leading-none">i</span>;
  if (type === "warn") return <span className="text-base font-bold leading-none">!</span>;
  return <span className="text-base font-bold leading-none">&times;</span>;
}

function DiagnosticCard({ d }: { d: Diagnostic }) {
  const s = DIAG_STYLES[d.level];
  return (
    <div className={`rounded-lg border p-3 ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-2.5">
        <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${s.text}`}>
          <DiagIcon type={s.icon} />
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${s.text}`}>{d.title}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{d.detail}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED UI
   ═══════════════════════════════════════════════════════ */

function ResultRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className={`text-sm font-mono font-medium ${accent ? "text-[var(--primary)]" : ""}`}>{value}</span>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  helpText,
  mono = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helpText?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${mono ? "font-mono" : ""}`}
      />
      {helpText && <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{helpText}</p>}
    </div>
  );
}

function TipBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 text-xs leading-relaxed text-[var(--muted-foreground)]" style={{
      background: "color-mix(in srgb, var(--primary) 5%, transparent)",
      borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
    }}>
      <span className="font-semibold text-[var(--primary)]">{label}:</span>{" "}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 1 — SUBNET CALC
   ═══════════════════════════════════════════════════════ */

const PRESETS = [
  { label: "Typical BACnet /24", ip: "192.168.1.0", cidr: 24 },
  { label: "BACnet MSTP trunk /24", ip: "10.10.1.0", cidr: 24 },
  { label: "Small closet /28", ip: "192.168.1.0", cidr: 28 },
  { label: "Building segment /22", ip: "10.0.0.0", cidr: 22 },
  { label: "Point-to-point /30", ip: "172.16.0.0", cidr: 30 },
];

function SubnetCalcTab() {
  const [ip, setIp] = useState("192.168.1.100");
  const [cidr, setCidr] = useState(24);

  const result = useMemo(() => subnetCalc(ip, cidr), [ip, cidr]);

  const diagnostics = useMemo<Diagnostic[]>(() => {
    if (!result) return [];
    const diags: Diagnostic[] = [];
    const ipNum = ipToNum(ip);
    if (ipNum === null) return [];

    // Check if IP is the network address
    if (ipNum === result.networkNum && cidr < 31) {
      diags.push({ level: "error", title: "IP is the network address", detail: `${ip} is the network address for this subnet. It cannot be assigned to a device. Use ${result.firstUsable} through ${result.lastUsable}.` });
    }
    // Check if IP is the broadcast address
    if (ipNum === result.broadcastNum && cidr < 31) {
      diags.push({ level: "error", title: "IP is the broadcast address", detail: `${ip} is the directed broadcast address for this subnet. It cannot be assigned to a device.` });
    }
    // BACnet broadcast note
    if (cidr < 31 && diags.length === 0) {
      diags.push({ level: "info", title: `BACnet/IP broadcast: ${result.broadcast}`, detail: `BACnet Who-Is and I-Am use this directed broadcast address. Ensure your switch and firewall allow UDP 47808 broadcasts to ${result.broadcast}.` });
    }
    // Large subnet warning
    if (result.usableHosts > 500) {
      diags.push({ level: "warning", title: "Large broadcast domain", detail: `${result.usableHosts} possible hosts — BACnet Who-Is broadcasts reach ALL devices on this subnet. On busy networks, this can cause missed responses. Consider segmenting with /24 or /25 subnets and using BBMDs between them.` });
    }
    // Small subnet info
    if (cidr >= 30) {
      diags.push({ level: "info", title: "Very small subnet", detail: `/${cidr} provides only ${result.usableHosts} usable addresses. This is typical for point-to-point links between routers, not for BACnet device subnets.` });
    }

    return diags;
  }, [ip, cidr, result]);

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
              className="px-2.5 py-1.5 text-xs rounded-md bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="IP Address" value={ip} onChange={setIp} placeholder="192.168.1.100" />
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">CIDR / Prefix</label>
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
          <ResultRow label="Broadcast (BACnet Who-Is target)" value={result.broadcast} />
          <ResultRow label="Subnet Mask" value={result.mask} />
          <ResultRow label="First Usable" value={result.firstUsable} accent />
          <ResultRow label="Last Usable" value={result.lastUsable} accent />
          <ResultRow label="Usable Hosts" value={result.usableHosts.toLocaleString()} />
          <ResultRow label="CIDR" value={`${result.network}/${result.cidr}`} />
          <ResultRow label="BACnet/IP Port" value={`UDP ${BACNET_DEFAULT_PORT} (0xBAC0)`} />
        </div>
      )}

      {!result && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
          Enter a valid IPv4 address to see subnet details.
        </div>
      )}

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <div className="space-y-2">
          {diagnostics.map((d, i) => <DiagnosticCard key={i} d={d} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 2 — DEVICE CONFIG VALIDATOR
   ═══════════════════════════════════════════════════════ */

function DeviceCheckTab() {
  const [deviceIp, setDeviceIp] = useState("");
  const [mask, setMask] = useState("255.255.255.0");
  const [gateway, setGateway] = useState("");
  const [port, setPort] = useState("47808");
  const [instance, setInstance] = useState("");
  const [networkNum, setNetworkNum] = useState("");

  const diagnostics = useMemo<Diagnostic[]>(() => {
    const diags: Diagnostic[] = [];
    if (!deviceIp.trim()) return [];

    const ipNum = ipToNum(deviceIp);
    if (ipNum === null) {
      diags.push({ level: "error", title: "Invalid IP address", detail: `"${deviceIp}" is not a valid IPv4 address. Expected format: x.x.x.x where each octet is 0–255.` });
      return diags;
    }

    // Parse mask
    const cidr = parseMask(mask);
    if (cidr === null) {
      diags.push({ level: "error", title: "Invalid subnet mask", detail: `"${mask}" is not a valid subnet mask. Use dotted notation (255.255.255.0) or CIDR (/24). Mask must be contiguous.` });
      return diags;
    }

    const subnet = subnetCalc(deviceIp, cidr)!;

    // IP = network address?
    if (ipNum === subnet.networkNum && cidr < 31) {
      diags.push({ level: "error", title: "IP is the network address", detail: `${deviceIp} is the network address for ${subnet.network}/${cidr}. This cannot be assigned to a device.` });
    }
    // IP = broadcast?
    if (ipNum === subnet.broadcastNum && cidr < 31) {
      diags.push({ level: "error", title: "IP is the broadcast address", detail: `${deviceIp} is the broadcast address for this subnet. This cannot be assigned to a device.` });
    }

    // Loopback
    if ((ipNum >>> 24) === 127) {
      diags.push({ level: "error", title: "Loopback address", detail: "127.x.x.x is a loopback address and cannot be used for BACnet devices." });
    }

    // APIPA
    if ((ipNum >>> 16) === 0xA9FE) {
      diags.push({ level: "warning", title: "Link-local / APIPA address", detail: "169.254.x.x indicates the device failed to get a DHCP address. BACnet devices should use static IPs. Configure a static IP on the device." });
    }

    // Gateway validation
    const gwTrimmed = gateway.trim();
    if (gwTrimmed && gwTrimmed !== "0.0.0.0") {
      const gwNum = ipToNum(gwTrimmed);
      if (gwNum === null) {
        diags.push({ level: "error", title: "Invalid gateway", detail: `"${gwTrimmed}" is not a valid IPv4 address.` });
      } else {
        const gwSame = isInSameSubnet(deviceIp, gwTrimmed, cidr);
        if (gwSame === false) {
          diags.push({ level: "error", title: "Gateway is on a different subnet", detail: `Device (${deviceIp}) and gateway (${gwTrimmed}) are not on the same /${cidr} subnet. The device CANNOT reach this gateway. Fix the gateway IP or the device's subnet mask.` });
        }
        if (gwNum === ipNum) {
          diags.push({ level: "error", title: "Gateway = Device IP", detail: "The gateway cannot be the same as the device's own IP address." });
        }
        if (gwNum === subnet.broadcastNum) {
          diags.push({ level: "error", title: "Gateway is the broadcast address", detail: `${gwTrimmed} is the broadcast address for this subnet. The gateway must be a real router interface.` });
        }
        if (gwNum === subnet.networkNum && cidr < 31) {
          diags.push({ level: "error", title: "Gateway is the network address", detail: `${gwTrimmed} is the network address. The gateway must be a routable host IP.` });
        }
        if (gwSame === true && gwNum !== ipNum && gwNum !== subnet.broadcastNum && gwNum !== subnet.networkNum) {
          diags.push({ level: "valid", title: "Gateway is reachable", detail: `${gwTrimmed} is on the same subnet as the device. Verify this IP belongs to an actual router/L3 switch interface.` });
        }
      }
    } else if (!gwTrimmed || gwTrimmed === "0.0.0.0") {
      diags.push({ level: "info", title: "No gateway configured", detail: "Without a gateway, this device can only communicate within its local subnet. This is fine if all BACnet devices and the front-end are on the same subnet. If cross-subnet communication is needed, a gateway is required." });
    }

    // Port validation
    const portNum = parseInt(port.trim(), 10);
    if (port.trim()) {
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        diags.push({ level: "error", title: "Invalid UDP port", detail: "Port must be between 1 and 65535." });
      } else if (portNum === BACNET_DEFAULT_PORT) {
        diags.push({ level: "valid", title: "Standard BACnet/IP port", detail: `UDP ${BACNET_DEFAULT_PORT} (0xBAC0) is the standard BACnet/IP port. All devices on the network must use the same port.` });
      } else {
        diags.push({ level: "warning", title: `Non-standard port: ${portNum}`, detail: `The standard BACnet/IP port is UDP 47808 (0xBAC0). Using ${portNum} means ALL other BACnet devices, BBMDs, and workstations must also be set to this port. This is uncommon and can cause discovery failures if not consistent.` });
      }
    }

    // Device instance validation
    const instTrimmed = instance.trim();
    if (instTrimmed) {
      const instNum = parseInt(instTrimmed, 10);
      if (isNaN(instNum) || instNum < 0) {
        diags.push({ level: "error", title: "Invalid device instance", detail: "Device instance must be a non-negative integer." });
      } else if (instNum > BACNET_MAX_INSTANCE) {
        diags.push({ level: "error", title: "Device instance out of range", detail: `Maximum device instance is ${BACNET_MAX_INSTANCE.toLocaleString()} (2^22 - 1). Value ${instNum.toLocaleString()} exceeds this limit.` });
      } else if (instNum === 0) {
        diags.push({ level: "warning", title: "Device instance is 0", detail: "Instance 0 is valid but uncommon. Some front-ends and BACnet explorers have issues with instance 0. Consider using a positive value." });
      } else if (instNum >= 4000000) {
        diags.push({ level: "warning", title: "Very high device instance", detail: `Instance ${instNum.toLocaleString()} is near the maximum (${BACNET_MAX_INSTANCE.toLocaleString()}). Verify this is intentional. Instances above 4,000,000 are sometimes reserved by manufacturers for internal use.` });
      } else {
        diags.push({ level: "valid", title: `Device instance ${instNum.toLocaleString()} is valid`, detail: "Ensure this instance number is unique across your entire BACnet network (all subnets). Duplicate instances are the #1 cause of intermittent BACnet communication failures." });
      }
    }

    // Network number validation
    const netTrimmed = networkNum.trim();
    if (netTrimmed) {
      const netNum = parseInt(netTrimmed, 10);
      if (isNaN(netNum) || netNum < 0) {
        diags.push({ level: "error", title: "Invalid network number", detail: "Network number must be a non-negative integer." });
      } else if (netNum === 0) {
        diags.push({ level: "info", title: "Network number 0 (local only)", detail: "Network 0 means the device uses local-only addressing and does not participate in BACnet internetwork routing. This is fine for single-subnet sites. If you need cross-subnet routing via BACnet routers, assign a non-zero network number." });
      } else if (netNum === BACNET_BROADCAST_NETWORK) {
        diags.push({ level: "error", title: "Network 65535 is reserved", detail: "Network number 65535 is the BACnet global broadcast network and cannot be assigned to a device. Use 1–65534." });
      } else if (netNum > BACNET_MAX_NETWORK) {
        diags.push({ level: "error", title: "Network number out of range", detail: `Valid range is 0–65534. 65535 is reserved for broadcast.` });
      } else {
        diags.push({ level: "valid", title: `Network number ${netNum} is valid`, detail: "Each BACnet/IP subnet that participates in internetwork routing must have a unique network number. Duplicate network numbers across different subnets will cause routing failures." });
      }
    }

    // If no errors, give overall summary
    const hasErrors = diags.some(d => d.level === "error");
    if (!hasErrors && diags.length > 0 && ipNum !== null) {
      diags.unshift({ level: "valid", title: "Configuration looks valid", detail: `${deviceIp} on subnet ${subnet.network}/${cidr}. BACnet broadcast target: ${subnet.broadcast}:${portNum || BACNET_DEFAULT_PORT}.` });
    }

    return diags;
  }, [deviceIp, mask, gateway, port, instance, networkNum]);

  return (
    <div className="space-y-4">
      <TipBox label="Device Config Validator">
        Enter a BACnet/IP device&apos;s network settings to check for common misconfigurations. All fields are optional except IP address.
      </TipBox>

      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Device IP Address" value={deviceIp} onChange={setDeviceIp} placeholder="192.168.1.100" />
        <FieldInput label="Subnet Mask" value={mask} onChange={setMask} placeholder="255.255.255.0" helpText="Dotted or CIDR (/24)" />
        <FieldInput label="Default Gateway" value={gateway} onChange={setGateway} placeholder="192.168.1.1" helpText="Leave blank if none" />
        <FieldInput label="UDP Port" value={port} onChange={setPort} placeholder="47808" helpText="Default: 47808 (0xBAC0)" />
        <FieldInput label="Device Instance" value={instance} onChange={setInstance} placeholder="100" helpText="0 – 4,194,303" />
        <FieldInput label="Network Number" value={networkNum} onChange={setNetworkNum} placeholder="0" helpText="0 = local only, 1–65534" />
      </div>

      {diagnostics.length > 0 && (
        <div className="space-y-2">
          {diagnostics.map((d, i) => <DiagnosticCard key={i} d={d} />)}
        </div>
      )}

      {!deviceIp.trim() && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
          Enter a device IP address to begin validation.
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 3 — REACHABILITY CHECKER
   ═══════════════════════════════════════════════════════ */

function ReachabilityTab() {
  const [deviceA, setDeviceA] = useState("");
  const [maskA, setMaskA] = useState("255.255.255.0");
  const [deviceB, setDeviceB] = useState("");
  const [maskB, setMaskB] = useState("255.255.255.0");
  const [hasBBMD, setHasBBMD] = useState<"unknown" | "yes" | "no">("unknown");

  const diagnostics = useMemo<Diagnostic[]>(() => {
    const diags: Diagnostic[] = [];
    if (!deviceA.trim() || !deviceB.trim()) return [];

    const numA = ipToNum(deviceA);
    const numB = ipToNum(deviceB);
    if (numA === null) { diags.push({ level: "error", title: "Invalid Device A IP", detail: `"${deviceA}" is not valid.` }); return diags; }
    if (numB === null) { diags.push({ level: "error", title: "Invalid Device B IP", detail: `"${deviceB}" is not valid.` }); return diags; }

    const cidrA = parseMask(maskA);
    const cidrB = parseMask(maskB);
    if (cidrA === null) { diags.push({ level: "error", title: "Invalid mask for Device A", detail: `"${maskA}" is not a valid subnet mask.` }); return diags; }
    if (cidrB === null) { diags.push({ level: "error", title: "Invalid mask for Device B", detail: `"${maskB}" is not a valid subnet mask.` }); return diags; }

    if (numA === numB) {
      diags.push({ level: "error", title: "Same IP address", detail: "Both devices have the same IP. This is an IP conflict. One or both devices must be changed." });
      return diags;
    }

    const subA = subnetCalc(deviceA, cidrA)!;
    const subB = subnetCalc(deviceB, cidrB)!;
    const sameFromA = isInSameSubnet(deviceA, deviceB, cidrA);
    const sameFromB = isInSameSubnet(deviceA, deviceB, cidrB);

    // Mismatched masks
    if (cidrA !== cidrB) {
      diags.push({ level: "warning", title: "Subnet masks don't match", detail: `Device A uses /${cidrA} (${numToIp(cidrToMask(cidrA))}) and Device B uses /${cidrB} (${numToIp(cidrToMask(cidrB))}). Mismatched masks can cause asymmetric routing — A may think B is local but B may think A is remote, or vice versa. Set both devices to the same mask.` });
    }

    // Same subnet?
    if (sameFromA && sameFromB) {
      diags.push({ level: "valid", title: "Same subnet — direct communication", detail: `Both devices are on network ${subA.network}/${cidrA}. BACnet Who-Is broadcasts will reach both devices directly. No BBMD or routing is required.` });
      diags.push({ level: "info", title: `Broadcast address: ${subA.broadcast}`, detail: `BACnet discovery uses directed broadcast to ${subA.broadcast}:47808. Ensure switches allow this broadcast.` });
    } else {
      diags.push({ level: "warning", title: "Different subnets — routing required", detail: `Device A is on ${subA.network}/${cidrA}, Device B is on ${subB.network}/${cidrB}. BACnet Who-Is broadcasts do NOT cross subnet boundaries by default.` });

      if (hasBBMD === "yes") {
        diags.push({ level: "info", title: "BBMD configured — verify BDT entries", detail: `Ensure each subnet has exactly ONE BBMD. Each BBMD's Broadcast Distribution Table (BDT) must list the BBMD on every other subnet. Missing BDT entries = discovery failures.` });
      } else if (hasBBMD === "no") {
        diags.push({ level: "error", title: "No BBMD — cross-subnet discovery will fail", detail: "Without a BBMD on each subnet, BACnet Who-Is/I-Am broadcasts cannot cross between subnets. Solutions: (1) Configure a BBMD on each subnet, (2) Use IP helper-address on the router for UDP 47808, (3) Move devices to the same subnet." });
      } else {
        diags.push({ level: "warning", title: "BBMD status unknown", detail: "Cross-subnet BACnet requires either BBMDs on each subnet or IP helper-address forwarding for UDP 47808. Without one of these, discovery will fail. Determine if BBMDs are configured on your network." });
      }

      diags.push({ level: "info", title: "Foreign Device option", detail: "If your workstation is on a third subnet, register as a Foreign Device to a BBMD. Set the BBMD IP and TTL (typically 300 seconds) in your BACnet explorer." });
    }

    return diags;
  }, [deviceA, maskA, deviceB, maskB, hasBBMD]);

  return (
    <div className="space-y-4">
      <TipBox label="Reachability Check">
        Determine whether two BACnet/IP devices can discover each other. Enter both devices&apos; IP addresses and masks.
      </TipBox>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
        <h4 className="text-sm font-semibold">Device A</h4>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="IP Address" value={deviceA} onChange={setDeviceA} placeholder="192.168.1.100" />
          <FieldInput label="Subnet Mask" value={maskA} onChange={setMaskA} placeholder="255.255.255.0" />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
        <h4 className="text-sm font-semibold">Device B</h4>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="IP Address" value={deviceB} onChange={setDeviceB} placeholder="10.10.1.50" />
          <FieldInput label="Subnet Mask" value={maskB} onChange={setMaskB} placeholder="255.255.255.0" />
        </div>
      </div>

      {/* BBMD question — only shown when devices are on different subnets */}
      {deviceA.trim() && deviceB.trim() && (() => {
        const cA = parseMask(maskA);
        const cB = parseMask(maskB);
        if (cA === null || cB === null) return false;
        const same = isInSameSubnet(deviceA, deviceB, cA);
        return same === false;
      })() && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h4 className="text-sm font-semibold mb-2">Is a BBMD configured on each subnet?</h4>
          <div className="flex gap-2">
            {(["yes", "no", "unknown"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setHasBBMD(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  hasBBMD === v
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure"}
              </button>
            ))}
          </div>
        </div>
      )}

      {diagnostics.length > 0 && (
        <div className="space-y-2">
          {diagnostics.map((d, i) => <DiagnosticCard key={i} d={d} />)}
        </div>
      )}

      {(!deviceA.trim() || !deviceB.trim()) && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
          Enter both device IP addresses to check reachability.
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 4 — VLAN REFERENCE
   ═══════════════════════════════════════════════════════ */

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
    content: "Laptops and temporary workstations should register as Foreign Devices to a BBMD rather than being added to the BDT. FDR uses a time-to-live (typically 300 seconds) and must be renewed periodically. Your BACnet explorer handles renewal automatically.",
  },
  {
    title: "IP Helpers / UDP Forwarding",
    content: "Alternative to BBMD: configure 'ip helper-address' on router interfaces to forward UDP 47808 broadcasts between subnets. Simpler but less standard — not all routers handle it well for BACnet's broadcast patterns.",
  },
  {
    title: "Multiport Devices",
    content: "Some controllers (Tridium JACE, Distech EC-BOS) have multiple Ethernet ports. Ensure the BACnet/IP interface is on the correct port/VLAN, not the management interface. The BACnet port and management port typically have separate IP configs.",
  },
  {
    title: "NAT and BACnet/IP",
    content: "BACnet/IP does NOT work through NAT. The protocol embeds IP addresses inside application-layer messages (B/IP header). NAT translates the outer IP but not the embedded address, causing misrouted responses. Keep all BACnet devices on routable (non-NAT) subnets.",
  },
];

function VlanReferenceTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <TipBox label="Key Ports">
        BACnet/IP = UDP <span className="font-mono text-[var(--foreground)]">47808</span> (0xBAC0) |
        BACnet/SC = TCP <span className="font-mono text-[var(--foreground)]">443</span> (TLS) |
        Foreign Device = UDP <span className="font-mono text-[var(--foreground)]">47808</span> (same port, different message type)
      </TipBox>

      {VLAN_NOTES.map((note) => (
        <button
          key={note.title}
          onClick={() => setExpanded(expanded === note.title ? null : note.title)}
          className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--ring)]"
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

/* ═══════════════════════════════════════════════════════
   TAB 5 — TROUBLESHOOTER (Decision Tree)
   ═══════════════════════════════════════════════════════ */

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
    fix: "Your BACnet/IP connection is working correctly. If you have intermittent issues, check for: (1) Duplicate Device Instance numbers — very common after cloning/replacing controllers, (2) Network congestion — too many Who-Is requests, (3) APDU timeout too short — try increasing to 6000–10000ms.",
  },
  {
    id: "read_fail",
    question: "",
    fix: "Device responds to Who-Is but won't let you read objects. Check: (1) Device Instance number is correct in your read request, (2) APDU timeout — increase from 3000ms to 10000ms, (3) Device is overloaded — reduce polling rate or number of concurrent readers, (4) Segmentation — if reading large arrays, the device may not support segmented transfers. Try reading single properties instead of ReadPropertyMultiple.",
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
    question: "Are you on the same subnet as the device?",
    detail: "Compare your workstation's IP and mask with the device's. Use the Subnet Calc tab or Reachability tab to verify.",
    yes: "same_sub_no_bacnet",
    no: "diff_sub_no_bacnet",
  },
  {
    id: "diff_sub_no_bacnet",
    question: "Are you registered as a Foreign Device to a BBMD?",
    detail: "If your laptop is on a different subnet, you must register as a Foreign Device. In your BACnet explorer settings, enter the BBMD's IP and a TTL (e.g., 300 seconds).",
    yes: "check_instance",
    no: "fdr_fix",
  },
  {
    id: "fdr_fix",
    question: "",
    fix: "Register as a Foreign Device: In your BACnet explorer, find the BBMD/Foreign Device settings. Enter the BBMD's IP address and set TTL to 300 seconds. If no BBMD exists on the device's subnet, you must either (1) configure one, (2) add an IP helper-address for UDP 47808 on the router, or (3) move your laptop to the device's subnet.",
  },
  {
    id: "same_sub_no_bacnet",
    question: "Is your laptop's firewall allowing UDP 47808?",
    detail: "Windows Defender and other firewalls often block BACnet. Add inbound+outbound rules for UDP 47808. On Windows: netsh advfirewall firewall add rule name=\"BACnet\" dir=in action=allow protocol=UDP localport=47808",
    yes: "check_instance",
    no: "firewall_fix",
  },
  {
    id: "firewall_fix",
    question: "",
    fix: "Your firewall is likely blocking BACnet traffic. Fix: (1) Add inbound AND outbound firewall rules for UDP 47808, (2) Temporarily disable the firewall to test — if BACnet works with firewall off, you know it's a firewall rule issue, (3) Check if corporate VPN software is intercepting traffic — disconnect VPN if possible, (4) Try Wireshark — filter 'udp.port == 47808' to see if packets are being sent/received.",
  },
  {
    id: "check_instance",
    question: "Are there duplicate Device Instance numbers on the network?",
    detail: "Run a global Who-Is (instance range 0–4194303) and check for two devices reporting the same Instance number. This is very common after cloning/replacing controllers.",
    yes: "dup_fix",
    no: "port_block",
  },
  {
    id: "dup_fix",
    question: "",
    fix: "Duplicate Device Instance numbers cause one device to shadow the other — responses alternate unpredictably. Fix: Change one device's Instance to a unique value. Common convention: use building/floor prefix + last IP octet (e.g., Building 1, Floor 2, Device .45 → Instance 10245). After changing, restart the device's BACnet stack.",
  },
  {
    id: "port_block",
    question: "",
    fix: "All common causes eliminated. Advanced checks: (1) Wireshark — filter 'udp.port == 47808' to see traffic, (2) Verify the device's BACnet/IP interface is enabled (some devices have BACnet disabled by default), (3) Check if the device uses a non-standard port (some Siemens devices use 47809), (4) Verify the device's BACnet network number doesn't conflict with another subnet's number, (5) Power-cycle the device — some BACnet stacks need a restart after config changes.",
  },
  {
    id: "no_ping",
    question: "Is your laptop on the same subnet as the device?",
    detail: "Compare your IP (ipconfig/ifconfig) and subnet mask with the device's. Use the Subnet Calc tab to verify.",
    yes: "same_subnet",
    no: "diff_subnet",
  },
  {
    id: "diff_subnet",
    question: "",
    fix: "You're on a different subnet. Options: (1) Change your laptop's IP to the device's subnet (quickest for commissioning), (2) Ensure a router connects both subnets and routes are configured, (3) If using a managed switch, check that the correct VLAN is assigned to your port — 'show vlan brief' on Cisco, (4) If going through a VPN, the VPN tunnel may not route to the device's subnet.",
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
    fix: "No link light means physical layer issue: (1) Try a different cable, (2) Try a different switch port, (3) Check if the device has separate ports (BACnet vs. service/config) — you may be on the wrong one, (4) Some controllers need PoE — verify the switch provides power, (5) Hard reset the device if nothing else works.",
  },
  {
    id: "link_ok",
    question: "Can you ping your own default gateway?",
    detail: "Check your gateway setting (ipconfig). Ping your gateway first to verify basic connectivity.",
    yes: "gw_ok",
    no: "gw_fix",
  },
  {
    id: "gw_ok",
    question: "",
    fix: "Link is up, same subnet, your gateway is reachable, but the device won't respond to ping. Check: (1) Device may have ICMP/ping disabled — some controllers do this by default, (2) IP conflict — another device has the same IP ('arp -a' to check MAC addresses), (3) Device may still be booting — some controllers take 2–3 minutes after power-up, (4) Clear ARP cache: 'arp -d [device IP]' then ping again.",
  },
  {
    id: "gw_fix",
    question: "",
    fix: "You can't reach your own gateway — this is a local network issue, not BACnet-specific: (1) Verify your port is on the correct VLAN, (2) Check cable/link to the switch, (3) Verify your IP settings are correct for this network, (4) If using Wi-Fi, try a wired connection — Wi-Fi may be on a different VLAN.",
  },
];

function TroubleshootTab() {
  const [path, setPath] = useState<string[]>(["start"]);

  const currentId = path[path.length - 1];
  const currentNode = DECISION_TREE.find((n) => n.id === currentId);

  const handleAnswer = (nextId: string) => {
    setPath([...path, nextId]);
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
          <button onClick={() => setPath(path.slice(0, -1))} className="text-[var(--primary)] hover:underline">
            Back
          </button>
        )}
        {path.length > 1 && (
          <button onClick={() => setPath(["start"])} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Reset
          </button>
        )}
      </div>

      {/* Current node */}
      {currentNode.fix ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 mb-2">Diagnosis</p>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{currentNode.fix}</p>
          <button
            onClick={() => setPath(["start"])}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Over
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h4 className="text-sm font-semibold mb-1">{currentNode.question}</h4>
          {currentNode.detail && (
            <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">{currentNode.detail}</p>
          )}
          <div className="flex gap-3">
            {currentNode.yes && (
              <button
                onClick={() => handleAnswer(currentNode.yes!)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              >
                Yes
              </button>
            )}
            {currentNode.no && (
              <button
                onClick={() => handleAnswer(currentNode.no!)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
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
            const label = node.fix ? "Diagnosis" : node.question?.slice(0, 35) + "...";
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

/* ═══════════════════════════════════════════════════════
   TAB 6 — MSTP PLANNER
   ═══════════════════════════════════════════════════════ */

const BAUD_RATES = [
  { baud: 9600, maxCable: "4000 ft (1200m)", maxDevices: 32, notes: "Default for most controllers. Safest for long runs." },
  { baud: 19200, maxCable: "4000 ft (1200m)", maxDevices: 32, notes: "Good balance of speed and reliability." },
  { baud: 38400, maxCable: "4000 ft (1200m)", maxDevices: 32, notes: "Common for Tridium, Distech. Reduce cable length if errors occur." },
  { baud: 76800, maxCable: "2000 ft (600m)", maxDevices: 32, notes: "High speed — shorter cable runs. Less common in BAS." },
];

const TOKEN_TIMING = [
  { devices: 5, baud: 38400, tokenRotation: "~50ms", pollRate: "~200ms", notes: "Fast — ideal for small trunks" },
  { devices: 10, baud: 38400, tokenRotation: "~100ms", pollRate: "~400ms", notes: "Typical VAV trunk" },
  { devices: 15, baud: 38400, tokenRotation: "~150ms", pollRate: "~600ms", notes: "Getting busy — watch for timeouts" },
  { devices: 20, baud: 38400, tokenRotation: "~200ms", pollRate: "~800ms", notes: "Near practical limit at 38400" },
  { devices: 25, baud: 38400, tokenRotation: "~250ms", pollRate: "~1.0s", notes: "May need to split trunk" },
  { devices: 32, baud: 38400, tokenRotation: "~320ms", pollRate: "~1.3s", notes: "Max spec — expect slow polling" },
  { devices: 10, baud: 9600, tokenRotation: "~400ms", pollRate: "~1.6s", notes: "Slow — avoid if possible at 9600" },
  { devices: 10, baud: 76800, tokenRotation: "~50ms", pollRate: "~200ms", notes: "Fast at 76800 — short cables only" },
];

const COLLISION_CHECKLIST = [
  { id: "baud", label: "All devices on this trunk are set to the SAME baud rate", detail: "Even one mismatched device will cause constant collisions. Check every device, including routers." },
  { id: "maxmaster", label: "Max Master is set correctly on ALL master devices", detail: "Max Master must be >= the highest MAC address on the trunk. Set it to the exact highest MAC for best performance." },
  { id: "duplicate", label: "No duplicate MAC addresses on the trunk", detail: "Two devices with the same MAC = guaranteed collisions. Use the address planner to track assignments." },
  { id: "termination", label: "RS-485 bus is terminated at BOTH ends (and only both ends)", detail: "120 ohm termination resistor at each end of the trunk. Missing termination = signal reflections." },
  { id: "polarity", label: "RS-485 wiring polarity is consistent (+ to +, - to -)", detail: "Swapped polarity on even one device will cause it to corrupt the bus. Use a scope or multimeter to verify." },
  { id: "stub", label: "No long stub/spur wires off the main trunk", detail: "MSTP is a daisy-chain bus, NOT a star topology. Stubs > 6 ft cause reflections." },
  { id: "shield", label: "Shielded cable with shield grounded at ONE end only", detail: "Ground the shield at the controller/router end. Grounding at both ends creates a ground loop." },
  { id: "power", label: "RS-485 bus is not run alongside high-voltage wiring", detail: "Keep MSTP cable at least 12 inches from 120V/277V wiring. Use separate conduit or tray." },
  { id: "router", label: "BACnet router is device MAC 0 or lowest MAC on trunk", detail: "The router should hold the token first for fastest routing. Convention: MAC 0 = router." },
  { id: "maxinfo", label: "Max Info Frames is set appropriately (default: 1)", detail: "Controls how many messages a device can send per token pass. Increase to 5 on routers for better throughput." },
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
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--accent)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Address Planner */}
      {section === "planner" && (
        <div className="space-y-4">
          <TipBox label="MSTP Addressing">
            MAC <span className="font-mono text-[var(--foreground)]">0–127</span> = Master devices (controllers, routers).
            MAC <span className="font-mono text-[var(--foreground)]">128–254</span> = Slave devices (sensors, actuators).
            MAC <span className="font-mono text-[var(--foreground)]">255</span> = Broadcast (reserved).
          </TipBox>

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
            <div className={`rounded-lg p-3 border ${
              recommendedMaxMaster <= 31
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            }`}>
              <p className={`text-sm font-semibold ${recommendedMaxMaster <= 31 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                Set Max Master = <span className="font-mono text-[var(--primary)]">{recommendedMaxMaster}</span>
              </p>
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
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                      : i <= highestMac
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-[var(--accent)] text-[var(--muted-foreground)]"
                  }`}
                  title={i === 0 ? "Router" : i <= highestMac ? "Active master" : "Available"}
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/20 inline-block" /> Router</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block" /> Active</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--accent)] inline-block" /> Available</span>
            </div>
          </div>

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

      {/* Baud & Wiring */}
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
              <p><strong className="text-[var(--foreground)]">Cable:</strong> 22 AWG shielded twisted pair (STP). Belden 9841 or equivalent.</p>
              <p><strong className="text-[var(--foreground)]">Topology:</strong> Daisy-chain ONLY. No stars, no tees, no branches.</p>
              <p><strong className="text-[var(--foreground)]">Termination:</strong> 120 ohm resistor across + and - at EACH END of the trunk only.</p>
              <p><strong className="text-[var(--foreground)]">Bias:</strong> Some trunks need bias resistors to hold the bus idle state. Most modern controllers have this built-in.</p>
              <p><strong className="text-[var(--foreground)]">Grounding:</strong> Ground the shield at the controller/head-end only. Never ground both ends.</p>
            </div>
          </div>

          <TipBox label="Field Tip">
            If you&apos;re getting intermittent comm losses, try reducing baud from 38400 to 19200 before re-wiring.
            A lower baud rate is more tolerant of cable issues and noise.
          </TipBox>
        </div>
      )}

      {/* Token Timing */}
      {section === "timing" && (
        <div className="space-y-4">
          <TipBox label="Token Passing">
            MSTP uses a token ring over RS-485. The token visits each master MAC from 0 to Max Master.
            Each device gets one chance to send per token rotation. More devices = slower polling.
          </TipBox>

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

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h4 className="text-sm font-semibold mb-3">Estimated Timing @ 38400 baud</h4>
            <ResultRow label="Token Rotation" value={`~${(deviceCount * 10).toLocaleString()}ms`} />
            <ResultRow label="Effective Poll Rate" value={`~${(deviceCount * 40).toLocaleString()}ms`} />
            <ResultRow label="Points per Second (est.)" value={`~${Math.round(1000 / (deviceCount * 40) * deviceCount * 5)} pts/s`} />
            <ResultRow label="Recommended Max Master" value={String(deviceCount)} accent />
          </div>

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
                    <tr key={i} className={t.devices === deviceCount ? "bg-[var(--accent)]" : ""}>
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
            <pre className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--background)] rounded p-3 leading-relaxed">
{`Token Rotation ≈ Max_Master × 10ms (at 38400 baud)
Token Rotation ≈ Max_Master × 40ms (at 9600 baud)
Poll Rate ≈ Token_Rotation × 4 (typical BACnet stack)
Max_Info_Frames = 1 (default) → 1 msg per token pass
Tusage_timeout = 20ms (how long to wait for response)
Treply_timeout = 255ms (max wait for poll response)`}
            </pre>
          </div>
        </div>
      )}

      {/* Collision Checklist */}
      {section === "collisions" && (
        <div className="space-y-4">
          <div className={`rounded-lg p-3 text-xs leading-relaxed border ${
            allChecked
              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "text-[var(--muted-foreground)]"
          }`} style={!allChecked ? {
            background: "color-mix(in srgb, var(--primary) 5%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          } : undefined}>
            {allChecked
              ? "All checks passed — your MSTP trunk configuration looks solid."
              : `Checked ${checkedItems.size} of ${COLLISION_CHECKLIST.length} items. Verify each item on-site.`}
          </div>

          <div className="space-y-2">
            {COLLISION_CHECKLIST.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`w-full text-left rounded-lg border p-3.5 transition-colors ${
                  checkedItems.has(item.id)
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--ring)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    checkedItems.has(item.id)
                      ? "bg-emerald-500 text-white"
                      : "border border-[var(--border)]"
                  }`}>
                    {checkedItems.has(item.id) ? "✓" : ""}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${checkedItems.has(item.id) ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
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

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

const TABS = ["Subnet Calc", "Device Check", "Reachability", "Network Ref", "Troubleshoot", "MSTP"] as const;
type Tab = (typeof TABS)[number];

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
      {tab === "Device Check" && <DeviceCheckTab />}
      {tab === "Reachability" && <ReachabilityTab />}
      {tab === "Network Ref" && <VlanReferenceTab />}
      {tab === "Troubleshoot" && <TroubleshootTab />}
      {tab === "MSTP" && <MstpPlannerTab />}
    </div>
  );
}
