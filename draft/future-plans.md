To ensure a frontend payload can be sent reliably and quickly across any network condition—including very slow ones like 2G or unstable 3G—the consensus from performance engineering communities and empirical testing is that you should aim to keep request payloads under 1–2 KB, and never exceed 500 KB even in non-critical scenarios 

. 

On extremely constrained networks (e.g., 2G with effective throughputs as low as 50–100 kbps), even a 5 KB payload can introduce noticeable delays due to high latency (often 1–3 seconds round-trip) and limited bandwidth. For a “snappy” user experience—where the request feels instantaneous—the payload should ideally be under 1,500 bytes, which aligns with typical MTU (Maximum Transmission Unit) limits on cellular networks and avoids IP fragmentation 
. In fact, studies of real-world APIs show that the median JSON payload size in REST systems is already around 1,545 bytes 

, suggesting this is a natural benchmark for efficiency. 

Regarding format, JSON is human-readable but not optimal for size or speed. For performance-critical applications, binary serialization formats like MessagePack or Protocol Buffers (Protobuf) are strongly recommended. MessagePack is often described as “binary JSON”—it preserves JSON-like structure but encodes it more compactly, often reducing size by 10–50% and improving parse speed significantly 
. Protobuf goes further, offering schema-driven compression, strong typing, and even faster serialization, though at the cost of readability and requiring pre-shared schemas 

. 

Communities like Stack Overflow and performance-focused engineering blogs consistently advocate for enabling compression (e.g., gzip or Brotli) on payloads over HTTP, especially when payloads exceed a few hundred bytes 

. However, for very small payloads (<1 KB), compression overhead may negate benefits—so minimizing the data at the source (e.g., sending only changed fields, using short keys like "u" instead of "userId") is more effective. 

In summary:   

    Ideal size: < 1–2 KB for fast, resilient transmission on all networks.  
    Format: MessagePack or Protobuf for minimal size and fastest decode; compressed JSON is acceptable if tooling simplicity is prioritized.  
    Key practice: Reduce data at the semantic level first—trim fields, use efficient IDs, avoid redundancy—before relying on transport-layer compression 