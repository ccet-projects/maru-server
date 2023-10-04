import { Encoder, Decoder } from 'socket.io-parser';

class MonkeyPatchedEncoder extends Encoder {
  encodeAsString(obj) {
    const hasSerializedData = typeof obj.data === 'string'
      && (obj.data[0] === '{' || obj.data[0] === '[');

    if (!hasSerializedData) {
      return super.encodeAsString(obj);
    }

    const strBody = obj.data;
    delete obj.data;
    return super.encodeAsString(obj) + strBody;
  }
}

export default { Decoder, Encoder: MonkeyPatchedEncoder };
