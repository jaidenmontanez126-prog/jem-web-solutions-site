import { getStore } from '@netlify/blobs';
import { createSaveImageHandler } from '../lib/design-storage.mjs';

export default createSaveImageHandler(() => getStore('jem-design-submissions'));
export const config = {
  method:'POST',
  rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:120}
};
