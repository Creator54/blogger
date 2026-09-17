---
title: "nix-systems"
date: "2026-09-08"
repo: "devswork-in/nix-systems"
---

# Nix-Systems (NixOS)

[![NixOS](https://img.shields.io/badge/NixOS-26.05-blue.svg?logo=nixos)](https://nixos.org)
[![Flakes](https://img.shields.io/badge/Nix-Flakes-informational.svg?logo=nixos)](https://nixos.wiki/wiki/Flakes)

NixOS configurations for an AMD/Niri workstation, an ARM production server,
VM validation, and preserved dormant machines.

## Layout

```
.
├── lib/                    # Helper functions (mkSystemConfig, mkAppImage)
├── profiles/               # Reusable profiles (base, desktop, server)
├── modules/
│   ├── apps/               # Application modules
│   ├── core/               # Core system modules
│   ├── desktop-utils/      # Desktop utilities and configurations
│   ├── desktops/           # Desktop environment modules
│   ├── server/             # Server configurations
│   ├── services/           # Service modules
│   └── extras/             # Additional modules
├── scheduled-scripts/      # Scheduled scripts
├── hosts/                  # Machine-specific configs
├── flake.nix               # Main configuration
├── config.nix              # User settings
└── sync-config.nix         # Sync configuration
```

## Quick Start

1. Boot NixOS ISO
2. Run setup script:

```bash
sudo sh -c 'curl -sSL https://raw.githubusercontent.com/devswork-in/nix-systems/main/setup.sh | bash -s /dev/nvme0n1 omnix'
```

**Warning**: Wipes `/dev/nvme0n1`, repartitions & installs `omnix` flake.

## Systems

See [CONTEXT.md](https://github.com/devswork-in/nix-systems/blob/main/CONTEXT.md) for the active/dormant target matrix and hardware
boundaries.

## Commands

See [Usage](https://github.com/devswork-in/nix-systems/blob/main/docs/usage.md) for full details and [Setup](https://github.com/devswork-in/nix-systems/blob/main/docs/setup.md) for installation.

```bash
sudo nixos-rebuild switch --flake .#omnix --impure       # Local workstation
nix run github:serokell/deploy-rs -- .#phoenix-arm      # Production server only
nix-repo-sync-force                                     # Force sync
nix-repo-sync-logs                                      # View logs
nix-cleanup --dry-run                                   # Cleanup preview
nix-cleanup                                             # Full cleanup
nixos-rebuild build-vm --flake .#omnix --impure          # GUI VM
nixos-rebuild build-vm --flake .#phoenix-x86 --impure    # Fast headless VM
```

## Deployment

### Phoenix (ARM)

Free at least 8 GiB on Phoenix before deployment. The x86 Phoenix output is
VM-only and is deliberately absent from `deploy.nodes`.

**Remote Build** (builds on target):
```bash
nixos-rebuild --flake .#phoenix-arm --target-host phoenix --build-host phoenix switch --no-reexec -S
```

**Local Build** (Builds locally & pushes):
```bash
nixos-rebuild --flake .#phoenix-arm --target-host phoenix switch --no-reexec
```

## Docs

- [Setup](https://github.com/devswork-in/nix-systems/blob/main/docs/setup.md)
- [Usage](https://github.com/devswork-in/nix-systems/blob/main/docs/usage.md)
- [Modules](https://github.com/devswork-in/nix-systems/blob/main/docs/modules.md)
- [Structure](https://github.com/devswork-in/nix-systems/blob/main/docs/structure.md)
- [Repo-Sync](https://github.com/devswork-in/nix-systems/blob/main/docs/repo-sync.md)


---
*This post was auto-generated from the [devswork-in/nix-systems](https://github.com/devswork-in/nix-systems) README. Last updated: 2026-09-14.*
