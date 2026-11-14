import { getStore } from '@netlify/blobs';
import { createLoadHandler } from '../lib/design-storage.mjs';

export default createLoadHandler(() => getStore('jem-design-submissions'));
export const config = {
  method: 'GET',
  rateLimit: {action:'rate_limit', aggregateBy:['ip','domain'], windowSize:60, windowLimit:60}
};
