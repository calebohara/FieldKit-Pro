# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-01

### Added
- Free/Pro tier subscription system with SubscriptionProvider and PaidFeatureGate
- PWA support with manifest.json and service worker for Add to Home Screen
- Error boundary components for graceful error handling
- Loading states across all tool pages
- Comprehensive README with setup and architecture documentation

### Changed
- Settings page now shows actual subscription tier from user profile
- Dashboard layout wrapped with SubscriptionProvider context

## [0.4.0] - 2026-03-01

### Added
- ABB Drive Tools: fault code lookup (F0001-F0064), parameter reference, common HVAC configurations
- Yaskawa Drive Tools: fault code lookup (48 codes), parameter reference, common HVAC configurations
- Tabbed interface for drive tools (Faults, Parameters, Common Configs)
- 6 common configuration templates per drive brand (BACnet, Modbus, AHU CV, AHU VAV, CT Fan, Pump)

## [0.3.0] - 2026-03-01

### Added
- PID Loop Tuning Calculator with process type, response time, and overshoot inputs
- 5 HVAC presets (AHU Discharge Air, Chilled Water Valve, Hot Water Valve, Static Pressure, Building Pressure)
- SVG response curve visualization
- Tuning tips reference section for common HVAC loops

## [0.2.0] - 2026-03-01

### Added
- PPCL Command Reference page with 44 searchable commands
- PPCL Common Errors page with 27 documented errors and fixes
- PPCL Code Analyzer with syntax highlighting and issue detection
- Reusable SearchableTable component with search, filtering, and mobile responsive layout
- Vercel deployment configuration

## [0.1.0] - 2026-03-01

### Added
- Initial Next.js project with TypeScript and Tailwind CSS v4
- Supabase authentication (email/password signup and login)
- Protected dashboard routes with middleware
- Dashboard layout with desktop sidebar and mobile bottom navigation
- Landing page with hero section, feature cards, and CTA
- Database schema with profiles table, tool_usage tracking, and RLS policies
- Settings page showing user email and plan
