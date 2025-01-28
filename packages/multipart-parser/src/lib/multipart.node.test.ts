import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getRandomBytes } from '../../test/utils.ts';
import { createMultipartMockRequest } from '../../test/utils.node.ts';

import { parseMultipart, type MultipartPart } from './multipart.ts';
import { parseMultipartRequest } from './multipart.node.ts';

describe('parseMultipartRequest (node)', () => {
  let boundary = 'boundary123';

  it('parses an empty multipart message', async () => {
    let request = createMultipartMockRequest(boundary);

    let parts = [];
    await parseMultipartRequest(request, (part) => {
      parts.push(part);
    });

    assert.equal(parts.length, 0);
  });

  it('parses a simple multipart form', async () => {
    let request = createMultipartMockRequest(boundary, {
      field1: 'value1',
    });

    let parts: MultipartPart[] = [];
    await parseMultipartRequest(request, (part) => {
      parts.push(part);
    });

    assert.equal(parts.length, 1);
    assert.equal(parts[0].name, 'field1');
    assert.equal(await parts[0].text(), 'value1');
  });

  it('parses large file uploads correctly', async () => {
    let content = getRandomBytes(1024 * 1024 * 10); // 10 MB file
    let request = createMultipartMockRequest(boundary, {
      file1: {
        filename: 'tesla.jpg',
        mediaType: 'image/jpeg',
        content,
      },
    });

    let parts: { name?: string; filename?: string; mediaType?: string; content: Uint8Array }[] = [];
    await parseMultipartRequest(request, async (part) => {
      parts.push({
        name: part.name,
        filename: part.filename,
        mediaType: part.mediaType,
        content: await part.bytes(),
      });
    });

    assert.equal(parts.length, 1);
    assert.equal(parts[0].name, 'file1');
    assert.equal(parts[0].filename, 'tesla.jpg');
    assert.equal(parts[0].mediaType, 'image/jpeg');
    assert.deepEqual(parts[0].content, content);
  });

  it('parses this example', async () => {
    //     var data = `--f4ca952c-0249-48ca-9626-cb0da7cc8953
    // Content-Disposition: form-data; name="changelog"

    // - ChangeFontSizeController: Corregido titulo de acción

    // --f4ca952c-0249-48ca-9626-cb0da7cc8953
    // Content-Disposition: form-data; name="product_name"

    // Nexion Smart ERP
    // --f4ca952c-0249-48ca-9626-cb0da7cc8953
    // Content-Disposition: form-data; name="version"

    // 24.4.0.3
    // --f4ca952c-0249-48ca-9626-cb0da7cc8953
    // Content-Disposition: form-data;name="upload_files";filename="NexionSmartERP-AnyCPU-24.4.0.3.exe"
    // Content-Type: application/octet-stream

    // TEST
    // --f4ca952c-0249-48ca-9626-cb0da7cc8953--`;

    // taken from packages/form-data-parser/src/lib/form-data.test.ts
    // "parses a multipart/form-data request"
    var data = [
      '------WebKitFormBoundary7MA4YWxkTrZu0gW',
      'Content-Disposition: form-data; name="text"',
      '',
      'Hello, World!',
      '------WebKitFormBoundary7MA4YWxkTrZu0gW',
      'Content-Disposition: form-data; name="file"; filename="example.txt"',
      'Content-Type: text/plain',
      '',
      'This is an example file.',
      '------WebKitFormBoundary7MA4YWxkTrZu0gW--',
    ].join('\r\n');

    let boundary = '------WebKitFormBoundary7MA4YWxkTrZu0gW';
    var parts = [];
    var message = new TextEncoder().encode(data);
    await parseMultipart(message, { boundary }, async (part) => {
      parts.push(part);
    });

    assert.equal(parts.length, 4);
  });
});
