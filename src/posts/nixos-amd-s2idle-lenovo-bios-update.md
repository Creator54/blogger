---
title: "AMD s2idle Sleep & Insyde BIOS on NixOS"
date: "2026-09-13"
---

# AMD s2idle Thermal Runaway & Insyde BIOS Updating on NixOS

Technical post-mortem and resolution for thermal runaway during lid sleep on AMD Zen4 (Lenovo IdeaPad Slim 5 16AHP9 / Type 83DD) running NixOS.

## Incident Root Cause Analysis

When closing the laptop lid, `systemd-suspend-then-hibernate` initiated `s2idle` (suspend-to-idle). Log inspection (`journalctl -b -1`) revealed an ACPI PEP DSM failure:

```
kernel: amd_pmc AMDI0009:00: Last suspend didn't reach deepest state
kernel: ACPI BIOS Error (bug): Could not resolve symbol [\_SB.PCI0.GP17.XHC3.RHUB], AE_NOT_FOUND
kernel: ACPI Error: Aborting method \_SB.PEP._DSM due to previous error (AE_NOT_FOUND)
```

After 15 minutes, `systemd-sleep` woke the CPU to initiate hibernation (`systemd-sleep: Performing sleep operation 'hibernate'`). The kernel logged `PM: hibernation: hibernation entry` and hung before writing the hibernation image to swap. The SoC remained powered with the display lid closed, resulting in severe thermal buildup.

## Firmware Update Procedure (Non-Windows Environment)

Inspection of DMI sysfs confirmed:
* **Installed Version**: `NGCN29WW` (2024-10-08)
* **Latest Available Version**: `NGCN34WW` (2026-01-16)

Lenovo packages firmware updates as a 7-Zip self-extracting Win32 executable ([`ngcn34ww.exe`](https://download.lenovo.com/consumer/mobiles/ngcn34ww.exe)), which embeds InsydeH2O `H2OFFT-Wx64.exe` and `ILS4P.bin`.

### Flashing via WinPE Live USB

1. **Download Assets**:
   * Lenovo BIOS executable: [`ngcn34ww.exe`](https://download.lenovo.com/consumer/mobiles/ngcn34ww.exe)
   * Windows PE image: [Hiren's BootCD PE](https://www.hirensbootcd.org/) ([`HBCD_PE_x64.iso`](https://www.hirensbootcd.org/files/HBCD_PE_x64.iso))
   ```bash
   wget https://download.lenovo.com/consumer/mobiles/ngcn34ww.exe
   axel -a -n 8 https://www.hirensbootcd.org/files/HBCD_PE_x64.iso
   ```
2. **Flash to [Ventoy](https://www.ventoy.net/) USB**:
   ```bash
   cp HBCD_PE_x64.iso ngcn34ww.exe /run/media/creator54/Ventoy/ && sync
   ```
3. **Execution**:
   * Boot into Ventoy (`F12`), launch [Hiren's BootCD PE](https://www.hirensbootcd.org/).
   * Verify AC adapter connection.
   * Run `ngcn34ww.exe`. `H2OFFT-Wx64.exe` loads `H2OFFT64.sys` in WinPE memory, writes the UEFI capsule trigger to NVRAM, and reboots.
   * Motherboard executes native Insyde UEFI capsule flash (`NGCN34WW`).

## NixOS Power Management Configuration Fix

To eliminate broken `suspend-then-hibernate` on AMD s2idle platforms, configure `services.logind` to enforce direct `hibernate` on lid closure:

In `hosts/omnix/hibernation.nix`:

```nix
services.logind = {
  settings.Login = {
    HandleLidSwitch = "hibernate";
    HandleLidSwitchDocked = "hibernate";
    HandleLidSwitchExternalPower = "hibernate";
  };
};
```

## Post-Fix Verification

```bash
cat /sys/class/dmi/id/bios_version   # NGCN34WW
cat /sys/class/dmi/id/bios_date      # 01/16/2026
sensors                               # CPU 53.4°C / NVMe 45.9°C
timedatectl                           # System clock synchronized: yes
nix flake check --all-systems --no-build --impure # All checks passed
```
