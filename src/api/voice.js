// WebRTC signaling helpers for voice rooms

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
    // Add TURN servers for production (Twilio, Xirsys, etc.)
  ]
};

export const createPeerConnection = () => {
  return new RTCPeerConnection(ICE_SERVERS);
};

export const createOffer = async (pc) => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
};

export const createAnswer = async (pc, offer) => {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
};

export const addIceCandidate = async (pc, candidate) => {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
};

export const getLocalStream = async (constraints = { audio: true, video: false }) => {
  return await navigator.mediaDevices.getUserMedia(constraints);
};
