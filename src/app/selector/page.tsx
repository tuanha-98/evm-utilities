'use client';

import { useState } from 'react';
import { Table, message } from 'antd';
import { SearchOutlined, CheckCircleFilled, CopyOutlined, StopOutlined } from '@ant-design/icons';
import styles from './signature.module.scss';

interface SignatureResult {
  hash: string;
  name: string;
  filtered: boolean;
  hasVerifiedContract: boolean;
  type: 'function' | 'event';
}

export default function SignatureLookup() {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SignatureResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    try {
      let url: URL;
      if (query.startsWith('0x')) {
        url = new URL('https://api.4byte.sourcify.dev/signature-database/v1/lookup?filter=false');
        if (query.length === 10) {
          url.searchParams.append('function', query);
        } else if (query.length === 66) {
          url.searchParams.append('event', query);
        } else {
          message.error('Invalid hash length. Must be 4 bytes (8 hex chars) or 32 bytes (64 hex chars).');
          setLoading(false);
          return;
        }
      } else {
        url = new URL('https://api.4byte.sourcify.dev/signature-database/v1/search?filter=false');
        url.searchParams.append('query', query);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.ok) {
        const flattened: SignatureResult[] = [];

        if (data.result.function) {
          Object.entries(data.result.function).forEach(([hash, sigs]: [string, any]) => {
            sigs.forEach((sig: any) => {
              flattened.push({
                hash,
                name: sig.name,
                filtered: sig.filtered,
                hasVerifiedContract: sig.hasVerifiedContract,
                type: 'function',
              });
            });
          });
        }

        if (data.result.event) {
          Object.entries(data.result.event).forEach(([hash, sigs]: [string, any]) => {
            sigs.forEach((sig: any) => {
              flattened.push({
                hash,
                name: sig.name,
                filtered: sig.filtered,
                hasVerifiedContract: sig.hasVerifiedContract,
                type: 'event',
              });
            });
          });
        }

        setResults(flattened);
      } else {
        message.error(data.error || 'Failed to fetch signatures');
      }
    } catch (error) {
      message.error('An error occurred while fetching signatures');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <span className={`${styles.tag} ${type === 'function' ? styles.fn : styles.event}`}>
          {type}
        </span>
      ),
    },
    {
      title: 'Signature',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className={styles.mono}>{name}</span>
      ),
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 320,
      render: (hash: string, record: SignatureResult) => (
        <div className={styles.hash}>
          {record.hasVerifiedContract ? (
            <span className={styles.verifiedBadge}>
              <CheckCircleFilled />
            </span>
          ) : (
            <span className={styles.unverifiedBadge}>
              <StopOutlined />
            </span>
          )}
          <span>{hash}</span>
          <CopyOutlined
            className={styles.copyIcon}
            onClick={() => {
              navigator.clipboard.writeText(hash);
              message.success('Copied');
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className={`${styles.page} ${!searched ? styles.pageIdle : ''}`}>
      <div className={styles.searchWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Selector</h1>
          <p className={styles.subtitle}>Look up EVM function and event signatures.</p>
        </div>
        <div className={styles.searchCard}>
          <SearchOutlined className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by function name or hex selector..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spin}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </>
              )}
          </button>
        </div>
      </div>

      {searched && (
        <div className={styles.results}>
          {!loading && (
            <p className={styles.resultCount}>
              {results.length} signature{results.length !== 1 ? 's' : ''} found
            </p>
          )}

          <div className={styles.tableWrapper}>
            {loading ? (
              <table className={styles.skeletonTable}>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>Type</th>
                    <th style={{ width: 400 }}>Signature</th>
                    <th style={{ width: 400 }}>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i}>
                      <td><div className={styles.skeletonLine} style={{ width: 50 }} /></td>
                      <td><div className={styles.skeletonLine} style={{ width: 400 }} /></td>
                      <td><div className={styles.skeletonLine} style={{ width: 400 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : results.length > 0 ? (
              <Table
                dataSource={results}
                columns={columns}
                rowKey={(record) => `${record.hash}-${record.name}`}
                pagination={results.length > 50 ? { pageSize: 50, showSizeChanger: false, size: 'small' } : false}
                size="middle"
              />
            ) : (
              <div className={styles.empty}>No signatures found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
