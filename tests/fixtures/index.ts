import * as path from 'path'

import {
  createImageData,
}                   from 'facenet'

export const FILE_DUMMY_PNG = path.join(
  __dirname,
  'dummy.png',
)

const UINT8_CLAMPED_ARRAY = new Uint8ClampedArray([
  0, 0, 0, 255,
  0, 0, 0, 255,
  100, 100, 100, 255,
  100, 100, 100, 255,
])
export const IMAGE_DATA = createImageData(UINT8_CLAMPED_ARRAY, 2, 2)
