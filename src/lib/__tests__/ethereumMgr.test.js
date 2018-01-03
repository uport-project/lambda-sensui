const EthereumMgr = require('../ethereumMgr')

describe('EthereumMgr', () => {

  let sut;
  
  beforeAll(() => {
      sut = new EthereumMgr();
  });

  test('empty constructor', () => {
      expect(sut).not.toBeUndefined();
  });

})