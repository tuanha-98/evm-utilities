import styles from './FormFields.module.scss';

interface TraceInputProps {
  rpcUrl: string;
  setRpcUrl: (val: string) => void;
  txHash: string;
  setTxHash: (val: string) => void;
}

export function TraceFields({ rpcUrl, setRpcUrl, txHash, setTxHash }: TraceInputProps) {
  return (
    <div className={styles.formGroup}>
      <div className={styles.field}>
        <label className={styles.label}>RPC URL</label>
        <input
          className={styles.input}
          placeholder="https://rpc.ankr.com/eth/..."
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Transaction Hash</label>
        <input
          className={styles.input}
          placeholder="0x..."
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
        />
      </div>
    </div>
  );
}

interface SimulateInputProps {
  sender: string;
  setSender: (val: string) => void;
  shouldDealToken: boolean;
  setShouldDealToken: (val: boolean) => void;
  tokenAddress: string;
  setTokenAddress: (val: string) => void;
  spender: string;
  setSpender: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  calldata: string;
  setCalldata: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  msgValue: string;
  setMsgValue: (val: string) => void;
  shouldForkBlock: boolean;
  setShouldForkBlock: (val: boolean) => void;
  blockNumber: string;
  setBlockNumber: (val: string) => void;
  rpcUrl: string;
  setRpcUrl: (val: string) => void;
}

export function SimulateFields({
  sender,
  setSender,
  shouldDealToken,
  setShouldDealToken,
  tokenAddress,
  setTokenAddress,
  spender,
  setSpender,
  amount,
  setAmount,
  calldata,
  setCalldata,
  to,
  setTo,
  msgValue,
  setMsgValue,
  shouldForkBlock,
  setShouldForkBlock,
  blockNumber,
  setBlockNumber,
  rpcUrl,
  setRpcUrl,
}: SimulateInputProps) {
  return (
    <div className={styles.formGroup}>
      <div className={styles.field}>
        <label className={styles.label}>RPC URL</label>
        <input
          className={styles.input}
          placeholder="https://rpc.ankr.com/eth/..."
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Sender</label>
          <input
            className={styles.input}
            placeholder="0x..."
            value={sender}
            onChange={(e) => setSender(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Target</label>
          <input
            className={styles.input}
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={shouldDealToken}
          onChange={(e) => setShouldDealToken(e.target.checked)}
        />
        Approve token
      </label>

      {shouldDealToken && (
        <div className={styles.section}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Token Address</label>
              <input
                className={styles.input}
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Amount (wei)</label>
              <input
                className={styles.input}
                placeholder="1000000000000000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Spender</label>
            <input
              className={styles.input}
              placeholder="0x..."
              value={spender}
              onChange={(e) => setSpender(e.target.value)}
            />
          </div>
        </div>
      )}

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={shouldForkBlock}
          onChange={(e) => setShouldForkBlock(e.target.checked)}
        />
        Fork block
      </label>

      {shouldForkBlock && (
        <div className={styles.section}>
          <div className={styles.field}>
            <label className={styles.label}>Block Number</label>
            <input
              className={styles.input}
              placeholder="0"
              value={blockNumber}
              onChange={(e) => setBlockNumber(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Value (ETH)</label>
        <input
          className={styles.input}
          placeholder="0"
          value={msgValue}
          onChange={(e) => setMsgValue(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Calldata</label>
        <textarea
          className={styles.textarea}
          rows={4}
          placeholder="0x..."
          value={calldata}
          onChange={(e) => setCalldata(e.target.value)}
        />
      </div>
    </div>
  );
}
