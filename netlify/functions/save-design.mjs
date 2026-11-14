import { getStore } from '@netlify/blobs';
import { createSaveHandler } from '../lib/design-storage.mjs';

export default createSaveHandler(() => getStore('jem-design-submissions'));
export const config = {
  method: 'POST',
  rateLimit: {action:'rate_limit', aggregateBy:['ip','domain'], windowSize:60, windowLimit:5}
};
