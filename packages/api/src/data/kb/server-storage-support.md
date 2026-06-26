---
id: server-storage-support
title: ARK-R Series Servers & Storage — Support Guide
category: enterprise-hardware
tags: server, storage, raid, firmware, enterprise, ark-r, nas, troubleshooting, iark
---

## Overview

ARK-R Series rack servers and NAS storage appliances are sold exclusively to B2B customers and supported through the **Ark Systems Enterprise Support Portal** at enterprise.arksystems.com.

All enterprise hardware ships with **iARK** — Ark's integrated remote management controller — providing out-of-band access for monitoring, firmware updates, and remote console even when the OS is unresponsive.

## Common Issues

### RAID Array Degraded

1. iARK sends an alert to the registered admin email within 5 minutes of drive failure
2. Replace the failed drive with an Ark-qualified replacement
3. The array rebuilds automatically — **do not power cycle during rebuild**

### Boot Failure After Firmware Update

1. Access the iARK remote console
2. Use the **Ark Firmware Recovery Tool** to restore the previous firmware version
3. A rollback package is bundled with every firmware release

### Memory ECC Errors

1. Check iARK hardware logs for DIMM slot errors
2. Multiple errors on the same DIMM indicate hardware failure — file a warranty claim

## Firmware Updates

- Always apply firmware through **iARK** or the **Ark Systems Enterprise Update Manager**
- Never apply firmware directly from the OS
- Always check the Ark Compatibility Matrix before updating
- Emergency firmware support is available 24/7 for Enterprise and VIP customers via the enterprise support line
