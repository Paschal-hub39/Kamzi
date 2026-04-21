// Offload E2E encryption/decrypt from main thread
self.onmessage = async (e) => {
  const { action, payload } = e.data;

  try {
    switch (action) {
      case 'encrypt': {
        const { text, secretKeyJwk } = payload;
        const secret = await importKey(secretKeyJwk);
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          secret,
          encoder.encode(text)
        );

        self.postMessage({
          success: true,
          result: {
            cipher: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
          }
        });
        break;
      }

      case 'decrypt': {
        const { cipher, iv, secretKeyJwk } = payload;
        const secret = await importKey(secretKeyJwk);
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(iv) },
          secret,
          new Uint8Array(cipher)
        );

        const decoder = new TextDecoder();
        self.postMessage({
          success: true,
          result: decoder.decode(decrypted)
        });
        break;
      }

      case 'deriveKey': {
        const { privateKeyJwk, publicKeyJwk } = payload;
        
        const privateKey = await crypto.subtle.importKey(
          'jwk',
          privateKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          ['deriveKey']
        );

        const publicKey = await crypto.subtle.importKey(
          'jwk',
          publicKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        const derived = await crypto.subtle.deriveKey(
          { name: 'ECDH', public: publicKey },
          privateKey,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        const exported = await crypto.subtle.exportKey('jwk', derived);
        self.postMessage({ success: true, result: exported });
        break;
      }

      default:
        self.postMessage({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};

async function importKey(jwk) {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
