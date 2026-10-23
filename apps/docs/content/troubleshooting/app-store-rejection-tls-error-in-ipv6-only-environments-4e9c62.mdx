---
title = "App Store Rejection: 'TLS error' in IPv6-only environments"
topics = [ "platform" ]
keywords = []
database_id = "ce8c04e4-d493-4e15-832a-e59bdcf2b093"
---

If your App Store submission is rejected with a 'TLS error' when tested in an IPv6-only environment, often citing a lack of AAAA records, it typically indicates application-level issues rather than a Supabase configuration problem.

## Why does this happen?

Supabase projects are designed for compatibility with IPv6-only NAT64/DNS64 environments through automatic IPv4-to-IPv6 translation. This means explicit AAAA records are not required for your `*.supabase.co` domain. The 'TLS error' usually points to how the application handles networking requests, which can interfere with this automatic translation.

## How to resolve this issue

- Ensure you're using hostnames, not IP addresses - Use project-ref.supabase.co everywhere in your code. See [Supporting IPv6 DNS64/NAT64 Networks](https://developer.apple.com/documentation/network/supporting_ipv6_dns64_nat64_networks)
- Use high-level networking APIs like `URLSession` that handle IPv6 automatically. See [`URLSession` Documentation](https://developer.apple.com/documentation/foundation/urlsession)
- Review your App Transport Security settings. See [Preventing Insecure Network Connections](https://developer.apple.com/documentation/security/preventing_insecure_network_connections)
- Test your app in an IPv6-only environment using Apple's Network Link Conditioner. See [Testing for IPv6 DNS64/NAT64 Compatibility](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/UnderstandingandPreparingfortheIPv6Transition/UnderstandingandPreparingfortheIPv6Transition.html#//apple_ref/doc/uid/TP40010220-CH213-SW1)
