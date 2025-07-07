// addEntry.test.js
const sql = require('mssql');
// const { addEntry } = require('./yourModule'); // adjust path as needed
const { addEntry } = require('../utils/bChain/addEntry');
// const { computeHash } = require('./hashUtil'); // wherever computeHash is defined
const { computeHash } = require('../utils/bChain/verifyChain');

jest.mock('mssql');
jest.mock('../utils/bChain/verifyChain');

describe('addEntry', () => {
  const mockData = {
    projId: 'P123',
    compReport: 'Report text',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a new block with correct hash and return success', async () => {
    // Mock DB config connection
    sql.connect.mockResolvedValueOnce();

    // Mock previous block
    const prevBlock = { id: 1, hash: 'abc123' };
    sql.query = jest.fn().mockResolvedValueOnce({ recordset: [prevBlock] });

    // Mock hash computation
    computeHash.mockReturnValueOnce('newHash456');

    // Mock request input and query
    const requestMock = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValueOnce(),
    };
    sql.Request.mockImplementation(() => requestMock);

    const result = await addEntry(mockData);

    expect(sql.connect).toHaveBeenCalled();
    expect(sql.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT TOP 1')
    );
    expect(computeHash).toHaveBeenCalledWith(JSON.stringify(mockData), 'abc123');

    expect(requestMock.input).toHaveBeenCalledWith('projId', sql.VarChar, mockData.projId);
    expect(requestMock.input).toHaveBeenCalledWith('compReport', sql.VarChar, mockData.compReport);
    expect(requestMock.input).toHaveBeenCalledWith('hash', sql.VarChar, 'newHash456');
    expect(requestMock.input).toHaveBeenCalledWith('prev_hash', sql.VarChar, 'abc123');

    expect(requestMock.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ComplianceLedger'));

    expect(result).toEqual({ success: true, hash: 'newHash456' });
  });

  it('should use GENESIS as prevHash if no previous block exists', async () => {
    sql.connect.mockResolvedValueOnce();
    sql.query = jest.fn().mockResolvedValueOnce({ recordset: [] }); // no previous block
    computeHash.mockReturnValueOnce('genesisHash');

    const requestMock = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValueOnce(),
    };
    sql.Request.mockImplementation(() => requestMock);

    const result = await addEntry(mockData);

    expect(computeHash).toHaveBeenCalledWith(JSON.stringify(mockData), 'GENESIS');
    expect(result).toEqual({ success: true, hash: 'genesisHash' });
  });

  it('should return error on exception', async () => {
    sql.connect.mockRejectedValueOnce(new Error('DB connection failed'));

    const result = await addEntry(mockData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB connection failed');
  });
});
