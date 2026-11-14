import { getStore } from '@netlify/blobs';
import { createLoadImageHandler } from '../lib/design-storage.mjs';

export default createLoadImageHandler(() => getStore('jem-design-submissions'));
export const config = {method:'GET'};
