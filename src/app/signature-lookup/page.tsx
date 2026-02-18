'use client';

import { useState } from 'react';
import { Typography, Input, Table, Card, Space, Tag, Flex, Button, message, Skeleton } from 'antd';
import { SearchOutlined, CheckCircleFilled, CopyOutlined, StopOutlined } from '@ant-design/icons';
import './signature.css';

const { Text } = Typography;

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
        
        // Process functions
        if (data.result.function) {
          Object.entries(data.result.function).forEach(([hash, sigs]: [string, any]) => {
            sigs.forEach((sig: any) => {
              flattened.push({
                hash,
                name: sig.name,
                filtered: sig.filtered,
                hasVerifiedContract: sig.hasVerifiedContract,
                type: 'function'
              });
            });
          });
        }

        // Process events
        if (data.result.event) {
          Object.entries(data.result.event).forEach(([hash, sigs]: [string, any]) => {
            sigs.forEach((sig: any) => {
              flattened.push({
                hash,
                name: sig.name,
                filtered: sig.filtered,
                hasVerifiedContract: sig.hasVerifiedContract,
                type: 'event'
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
      width: 120,
      render: (type: string) => (
        <Tag 
          bordered={false} 
          style={{ 
            textTransform: 'capitalize', 
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: type === 'function' ? '#3b82f6' : '#8b5cf6', // Blue-500 : Violet-500
            background: type === 'function' ? '#eff6ff' : '#f5f3ff', // Blue-50 : Violet-50
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1
          }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 450,
      render: (name: string) => (
        <Text 
          copyable={{ icon: <CopyOutlined style={{ color: '#94a3b8', fontSize: '14px' }} /> }} 
          style={{ 
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', 
            fontSize: '14px', 
            color: '#1e293b', // Slate-800
            fontWeight: 500
          }}
        >
          {name}
        </Text>
      ),
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash: string, record: SignatureResult) => (
        <Flex align="center" gap="middle">
          {record.hasVerifiedContract ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#dcfce7' }}>
              <CheckCircleFilled style={{ color: '#16a34a', fontSize: '14px' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9' }}>
              <StopOutlined style={{ color: '#94a3b8', fontSize: '14px' }} />
            </div>
          )}
          <Text 
            copyable={{ icon: <CopyOutlined style={{ color: '#94a3b8', fontSize: '14px' }} /> }} 
            style={{ 
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', 
              fontSize: '13px', 
              color: '#64748b' // Slate-500
            }}
          >
            {hash}
          </Text>
        </Flex>
      ),
    },
  ];

  return (
    <div className="signature-lookup-container">
      <div 
        style={{ 
          maxWidth: '600px', 
          width: '100%',
          margin: '0 auto 32px auto', 
          marginTop: searched ? '0' : '20vh',
          transition: 'all 0.5s ease-in-out'
        }}
      >
        <Card 
          styles={{ body: { padding: 4 } }}
          style={{ 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            background: 'white'
          }}
        >
          <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <Input 
              size="large"
              placeholder="Search by function name (e.g. transfer) or hash (0x...)" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: '16px', margin: '0 4px' }} />}
              style={{ 
                border: 'none', 
                boxShadow: 'none',
                height: '48px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                flex: 1
              }}
            />
            <Button 
                type="primary" 
                size="large" 
                onClick={handleSearch} 
                loading={loading}
                style={{ 
                  width: '100px', 
                  height: '48px', 
                  borderRadius: '8px', 
                  background: '#1677ff', // Indigo-600
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                  border: 'none',
                  margin: '0'
                }}
            >
              Search
            </Button>
          </div>
        </Card>
      </div>

      <div style={{ minHeight: 0 }}>
        {searched && !loading && (
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <Text style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
              Found {results.length} signatures
            </Text>
          </div>
        )}
        
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: '40px' }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : (
            <Table 
              dataSource={results} 
              columns={columns} 
              rowKey={(record) => `${record.hash}-${record.name}`}
              pagination={results.length > 50 ? { pageSize: 50, showSizeChanger: false, size: 'small' } : false}
              locale={{ emptyText: searched ? 'No signatures found' : 'Enter a search term above' }}
              className="styled-signature-table"
              size="middle"
              tableLayout="fixed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
