import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  EncodedVideoPacketSource,
  Input,
  Mp4OutputFormat,
  Output,
} from 'mediabunny';

/** Remux separate video + audio MP4s into one MP4. Stream copy, no re-encode. */
export async function mux(video: Blob, audio: Blob): Promise<Blob> {
  const vIn = new Input({ source: new BlobSource(video), formats: ALL_FORMATS });
  const aIn = new Input({ source: new BlobSource(audio), formats: ALL_FORMATS });
  const vTrack = await vIn.getPrimaryVideoTrack();
  const aTrack = await aIn.getPrimaryAudioTrack();
  if (!vTrack) throw new Error('No video track');
  if (!aTrack) return video; // nothing to mux

  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  const vSrc = new EncodedVideoPacketSource(vTrack.codec!);
  const aSrc = new EncodedAudioPacketSource(aTrack.codec!);
  output.addVideoTrack(vSrc);
  output.addAudioTrack(aSrc);
  await output.start();

  const [vCfg, aCfg] = await Promise.all([vTrack.getDecoderConfig(), aTrack.getDecoderConfig()]);
  const copy = async (
    track: typeof vTrack | typeof aTrack,
    src: EncodedVideoPacketSource | EncodedAudioPacketSource,
    cfg: VideoDecoderConfig | AudioDecoderConfig | null,
  ) => {
    let first = true;
    for await (const packet of new EncodedPacketSink(track).packets()) {
      await (src as any).add(packet, first && cfg ? { decoderConfig: cfg } : undefined);
      first = false;
    }
  };
  await Promise.all([copy(vTrack, vSrc, vCfg), copy(aTrack, aSrc, aCfg)]);
  await output.finalize();
  return new Blob([target.buffer!], { type: 'video/mp4' });
}
