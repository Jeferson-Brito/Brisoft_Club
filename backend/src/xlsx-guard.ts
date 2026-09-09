import { assert } from "./domain.ts";
// Check central directory sizes before ExcelJS allocates the uncompressed workbook.
export function validateWorkbookArchive(buffer: Buffer) {
  let end = -1;
  for (
    let i = buffer.length - 22;
    i >= Math.max(0, buffer.length - 65557);
    i--
  ) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  assert(end >= 0, "Arquivo XLSX inválido");
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16),
    total = 0;
  assert(count > 0 && count <= 1000, "Planilha contém entradas demais");
  for (let index = 0; index < count; index++) {
    assert(
      offset + 46 <= buffer.length &&
        buffer.readUInt32LE(offset) === 0x02014b50,
      "Estrutura XLSX inválida",
    );
    const size = buffer.readUInt32LE(offset + 24);
    total += size;
    assert(total <= 32 * 1024 * 1024, "Planilha excede 32 MB descompactada");
    offset +=
      46 +
      buffer.readUInt16LE(offset + 28) +
      buffer.readUInt16LE(offset + 30) +
      buffer.readUInt16LE(offset + 32);
  }
}
