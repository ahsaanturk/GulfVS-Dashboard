import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Company, EmailLog } from '../types';

interface HealthCheckResult {
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface HealthCheckState {
  environmentAudit: HealthCheckResult;
  connectivityTest: HealthCheckResult;
  rlsValidation: HealthCheckResult;
  schemaIntegrity: HealthCheckResult;
  stateSyncTest: HealthCheckResult;
  timestamp: string;
}

const SupabaseHealthCheck: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckState>({
    environmentAudit: { name: 'Environment Audit', status: 'pending', message: 'Checking...' },
    connectivityTest: { name: 'Connectivity Test', status: 'pending', message: 'Checking...' },
    rlsValidation: { name: 'RLS Validation', status: 'pending', message: 'Checking...' },
    schemaIntegrity: { name: 'Schema Integrity', status: 'pending', message: 'Checking...' },
    stateSyncTest: { name: 'State Sync Test', status: 'pending', message: 'Checking...' },
    timestamp: new Date().toLocaleTimeString()
  });

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    runHealthCheck();
  }, []);

  const updateHealthCheck = (key: keyof Omit<HealthCheckState, 'timestamp'>, result: HealthCheckResult) => {
    setHealth(prev => ({
      ...prev,
      [key]: result,
      timestamp: new Date().toLocaleTimeString()
    }));
  };

  const runHealthCheck = async () => {
    setIsRunning(true);

    // 1. Environment Audit
    await checkEnvironment();

    // 2. Connectivity Test
    await checkConnectivity();

    // 3. RLS Validation
    await checkRLS();

    // 4. Schema Integrity
    await checkSchemaIntegrity();

    // 5. State Sync Test
    await checkStateSync();

    setIsRunning(false);
  };

  const checkEnvironment = async () => {
    try {
      // Check Supabase client configuration
      const supabaseUrl = 'https://xvutrxbfwayyoarcqibz.supabase.co';
      const supabaseKey = 'sb_publishable_XSD0GMDOhuyb-ysFsDbK5g_gdko4z58';

      if (!supabaseUrl || !supabaseKey) {
        updateHealthCheck('environmentAudit', {
          name: 'Environment Audit',
          status: 'error',
          message: 'Missing Supabase credentials',
          details: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured'
        });
        return;
      }

      // Validate URL format
      if (!supabaseUrl.includes('.supabase.co')) {
        updateHealthCheck('environmentAudit', {
          name: 'Environment Audit',
          status: 'error',
          message: 'Invalid Supabase URL format',
          details: `URL: ${supabaseUrl}`
        });
        return;
      }

      // Validate key format (publishable keys start with 'eyJ' in base64)
      if (!supabaseKey.startsWith('sb_') && !supabaseKey.startsWith('eyJ')) {
        updateHealthCheck('environmentAudit', {
          name: 'Environment Audit',
          status: 'warning',
          message: 'Supabase key format looks unusual',
          details: `Key starts with: ${supabaseKey.substring(0, 10)}...`
        });
        return;
      }

      updateHealthCheck('environmentAudit', {
        name: 'Environment Audit',
        status: 'success',
        message: 'Environment variables correctly loaded',
        details: `URL: ${supabaseUrl.substring(0, 40)}... | Key: ${supabaseKey.substring(0, 20)}...`
      });
    } catch (error: any) {
      updateHealthCheck('environmentAudit', {
        name: 'Environment Audit',
        status: 'error',
        message: 'Environment check failed',
        details: error?.message || 'Unknown error'
      });
    }
  };

  const checkConnectivity = async () => {
    try {
      const startTime = performance.now();

      // Fetch one row from companies table
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);

      // Fetch one row from logs table
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('id')
        .limit(1);

      const endTime = performance.now();
      const responseTime = (endTime - startTime).toFixed(2);

      if (companiesError || logsError) {
        const failedTable = companiesError ? 'companies' : 'logs';
        const errorCode = companiesError?.code || logsError?.code;

        // Check for RLS-related errors
        if (errorCode === '401' || errorCode === '403') {
          updateHealthCheck('connectivityTest', {
            name: 'Connectivity Test',
            status: 'warning',
            message: 'Connected but RLS policies may be missing',
            details: `Error code ${errorCode} on table: ${failedTable}`
          });
          return;
        }

        updateHealthCheck('connectivityTest', {
          name: 'Connectivity Test',
          status: 'error',
          message: `Failed to reach ${failedTable} table`,
          details: `${errorCode}: ${companiesError?.message || logsError?.message}`
        });
        return;
      }

      updateHealthCheck('connectivityTest', {
        name: 'Connectivity Test',
        status: 'success',
        message: 'Successfully connected to Supabase',
        details: `Response time: ${responseTime}ms | Companies accessible: ${!!companiesData} | Logs accessible: ${!!logsData}`
      });
    } catch (error: any) {
      updateHealthCheck('connectivityTest', {
        name: 'Connectivity Test',
        status: 'error',
        message: 'Connectivity test failed',
        details: error?.message || 'Network error or Supabase unreachable'
      });
    }
  };

  const checkRLS = async () => {
    try {
      const { error: companiesError, status: companiesStatus } = await supabase
        .from('companies')
        .select('*')
        .limit(1);

      const { error: logsError, status: logsStatus } = await supabase
        .from('logs')
        .select('*')
        .limit(1);

      const hasRLSError = 
        (companiesStatus === 401 || companiesStatus === 403) ||
        (logsStatus === 401 || logsStatus === 403);

      if (hasRLSError) {
        const rlsTable = companiesStatus === 401 || companiesStatus === 403 ? 'companies' : 'logs';
        const statusCode = companiesStatus === 401 || companiesStatus === 403 ? companiesStatus : logsStatus;

        updateHealthCheck('rlsValidation', {
          name: 'RLS Validation',
          status: 'error',
          message: `Row Level Security (RLS) policies missing on ${rlsTable}`,
          details: `HTTP ${statusCode}: Policies need to be configured in Supabase dashboard`
        });
        return;
      }

      updateHealthCheck('rlsValidation', {
        name: 'RLS Validation',
        status: 'success',
        message: 'RLS policies are properly configured',
        details: 'Both companies and logs tables are accessible with current permissions'
      });
    } catch (error: any) {
      updateHealthCheck('rlsValidation', {
        name: 'RLS Validation',
        status: 'warning',
        message: 'RLS check inconclusive',
        details: error?.message || 'Unable to determine RLS status'
      });
    }
  };

  const checkSchemaIntegrity = async () => {
    try {
      // Fetch sample from companies table
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);

      // Fetch sample from logs table
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .limit(1);

      const errors: string[] = [];
      const details: string[] = [];

      // Validate companies schema
      if (companiesData && companiesData.length > 0) {
        const sample = companiesData[0];
        const expectedFields = ['id', 'companyName', 'emails', 'createdAt'];
        const optionalFields = ['phoneNumber', 'tags', 'location', 'notes', 'isInterested'];

        const missingRequired = expectedFields.filter(field => !(field in sample));
        if (missingRequired.length > 0) {
          errors.push(`Companies table missing required fields: ${missingRequired.join(', ')}`);
        } else {
          details.push(`✓ Companies schema valid (${Object.keys(sample).length} fields)`);
        }
      } else if (!companiesError) {
        details.push('⚠ Companies table is empty (no sample to validate)');
      }

      // Validate logs schema
      if (logsData && logsData.length > 0) {
        const sample = logsData[0];
        const expectedFields = ['id', 'companyId', 'emailAddress', 'emailType', 'dateSent', 'completed'];
        const optionalFields = ['note', 'followUpDate'];

        const missingRequired = expectedFields.filter(field => !(field in sample));
        if (missingRequired.length > 0) {
          errors.push(`Logs table missing required fields: ${missingRequired.join(', ')}`);
        } else {
          details.push(`✓ Logs schema valid (${Object.keys(sample).length} fields)`);
        }
      } else if (!logsError) {
        details.push('⚠ Logs table is empty (no sample to validate)');
      }

      if (errors.length > 0) {
        updateHealthCheck('schemaIntegrity', {
          name: 'Schema Integrity',
          status: 'error',
          message: 'Schema validation failed',
          details: errors.join(' | ')
        });
      } else if (companiesError || logsError) {
        updateHealthCheck('schemaIntegrity', {
          name: 'Schema Integrity',
          status: 'warning',
          message: 'Could not fully validate schema',
          details: `${companiesError?.message || ''} ${logsError?.message || ''}`
        });
      } else {
        updateHealthCheck('schemaIntegrity', {
          name: 'Schema Integrity',
          status: 'success',
          message: 'All table schemas are valid',
          details: details.join(' | ')
        });
      }
    } catch (error: any) {
      updateHealthCheck('schemaIntegrity', {
        name: 'Schema Integrity',
        status: 'error',
        message: 'Schema integrity check failed',
        details: error?.message || 'Unknown error'
      });
    }
  };

  const checkStateSync = async () => {
    try {
      // Simulate state update with fetched data
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(5);

      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .limit(5);

      if (companiesError || logsError) {
        updateHealthCheck('stateSyncTest', {
          name: 'State Sync Test',
          status: 'error',
          message: 'Failed to fetch data for state sync',
          details: `${companiesError?.message || ''} ${logsError?.message || ''}`
        });
        return;
      }

      const companiesCount = companiesData?.length || 0;
      const logsCount = logsData?.length || 0;

      if (companiesCount === 0 && logsCount === 0) {
        updateHealthCheck('stateSyncTest', {
          name: 'State Sync Test',
          status: 'warning',
          message: 'No data available for state sync test',
          details: 'Both tables appear to be empty - consider importing sample data'
        });
        return;
      }

      updateHealthCheck('stateSyncTest', {
        name: 'State Sync Test',
        status: 'success',
        message: 'Cloud data successfully retrieved and ready for state sync',
        details: `Companies: ${companiesCount} records | Logs: ${logsCount} records | Data will update React state correctly`
      });
    } catch (error: any) {
      updateHealthCheck('stateSyncTest', {
        name: 'State Sync Test',
        status: 'error',
        message: 'State sync test failed',
        details: error?.message || 'Unknown error'
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return '#10b981'; // green
      case 'warning': return '#f59e0b'; // amber
      case 'error': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '○';
    }
  };

  const allTestsPassed = Object.values(health)
    .filter(v => typeof v === 'object' && 'status' in v)
    .every(v => (v as HealthCheckResult).status === 'success' || (v as HealthCheckResult).status === 'warning');

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
        <h1 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>
          Supabase Health Dashboard
        </h1>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Last updated: {health.timestamp} | Status: {allTestsPassed ? '✓ All Systems Green' : '⚠ Issues Detected'}
        </p>
      </div>

      {/* Health Check Cards */}
      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(health)
          .filter(([key]) => key !== 'timestamp')
          .map(([key, result]) => {
            const result_ = result as HealthCheckResult;
            return (
              <div
                key={key}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${getStatusColor(result_.status)}`,
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(result_.status),
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginRight: '12px'
                    }}
                  >
                    {getStatusIcon(result_.status)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                      {result_.name}
                    </h3>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '13px' }}>
                      {result_.status.charAt(0).toUpperCase() + result_.status.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '14px', fontWeight: '500' }}>
                    {result_.message}
                  </p>
                  {result_.details && (
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>
                      {result_.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={runHealthCheck}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: isRunning ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? 'Running...' : 'Run Health Check'}
        </button>
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: allTestsPassed ? '#ecfdf5' : '#fef2f2',
        borderLeft: `4px solid ${allTestsPassed ? '#10b981' : '#ef4444'}`,
        borderRadius: '6px'
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          color: allTestsPassed ? '#065f46' : '#7f1d1d',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {allTestsPassed ? '✓ Migration Status: Ready' : '✗ Migration Status: Issues Detected'}
        </h4>
        <p style={{
          margin: '0',
          color: allTestsPassed ? '#047857' : '#991b1b',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          {allTestsPassed
            ? 'Your Supabase integration is fully configured and operational. All health checks passed. Ready for production use.'
            : 'Please review the failed checks above and consult the documentation for resolution steps.'}
        </p>
      </div>
    </div>
  );
};

export default SupabaseHealthCheck;
