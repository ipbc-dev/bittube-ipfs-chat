// Ipfs daemon's default settings
export function defaultIpfsDaemonSettings(ipfsDataDir) {
  return {
    IpfsDataDir: ipfsDataDir,
    config : {
      Bootstrap: [
        "/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3",
        "/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM",
        "/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu",
        "/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm",
        "/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64"
      ],
      Addresses: {
        API: '/ip4/127.0.0.1/tcp/0',
        Swarm: [
          // '/ip4/0.0.0.0/tcp/0',
           '/dnsaddr/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
            '/dnsaddr/ws-star-signal-1.servep2p.com/tcp/443/wss/p2p-websocket-star',
            '/dnsaddr/ws-star-signal-2.servep2p.com/tcp/443/wss/p2p-websocket-star',
            '/dnsaddr/ws-star-signal-3.servep2p.com/tcp/443/wss/p2p-websocket-star'
          //'/dns4/ws-star.bit.tube/tcp/443/wss/p2p-websocket-star',
        ],
      },
      API: {
        HTTPHeaders: {
          "Access-Control-Allow-Origin": ['*'],
          "Access-Control-Allow-Methods": ["PUT", "GET", "POST"],
          "Access-Control-Allow-Credentials": ["true"]
        }
      },
      // Bootstrap: [],
      Discovery: {
        MDNS: {
          Enabled: false,
          Interval: 10
        },
        webRTCStar: {
          Enabled: false
        }
      },
    }
  }
}
