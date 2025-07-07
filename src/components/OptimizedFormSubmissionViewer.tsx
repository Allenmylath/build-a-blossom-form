
import React, { useState, useCallback, useMemo } from 'react';
import { FormSubmissionData, FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VirtualizedSubmissionList } from './virtual/VirtualizedSubmissionList';
import { useSubmissionsActions, useSubmissionsState } from '@/store';
import { Download, Search, Loader2, Calendar, Filter, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface OptimizedFormSubmissionViewerProps {
  formId: string;
  fields: FormField[];
  onRefresh?: () => void;
}

export const OptimizedFormSubmissionViewer: React.FC<OptimizedFormSubmissionViewerProps> = ({
  formId,
  fields,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { submissions, pagination, analytics, isLoading } = useSubmissionsState();
  const { fetchSubmissions, exportSubmissions, refreshSubmissions } = useSubmissionsActions();
  
  // Memoized filtered submissions for performance
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    
    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(submission => {
        const searchData = JSON.stringify(submission.data).toLowerCase();
        const searchId = submission.id.toLowerCase();
        const searchIP = (submission.ipAddress || '').toLowerCase();
        const term = debouncedSearchTerm.toLowerCase();
        
        return searchData.includes(term) || 
               searchId.includes(term) || 
               searchIP.includes(term);
      });
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate: Date;
      
      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          filterDate = new Date(0);
      }
      
      filtered = filtered.filter(submission => 
        new Date(submission.submittedAt) >= filterDate
      );
    }
    
    return filtered;
  }, [submissions, debouncedSearchTerm, dateFilter]);
  
  const handleExportCSV = useCallback(() => {
    exportSubmissions(formId, 'csv');
  }, [formId, exportSubmissions]);
  
  const handleExportJSON = useCallback(() => {
    exportSubmissions(formId, 'json');
  }, [formId, exportSubmissions]);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshSubmissions(formId);
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [formId, refreshSubmissions, onRefresh]);
  
  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !isLoading) {
      fetchSubmissions(formId, pagination.page + 1);
    }
  }, [formId, pagination.hasMore, pagination.page, isLoading, fetchSubmissions]);
  
  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold">Form Submissions</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{pagination.total} total submissions</span>
              {analytics && (
                <>
                  <span>•</span>
                  <span>{analytics.submissionsToday} today</span>
                  <span>•</span>
                  <span>{analytics.submissionsThisWeek} this week</span>
                </>
              )}
            </div>
          </div>
          {(isRefreshing || isLoading) && (
            <div className="flex items-center text-blue-600">
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              <span className="text-sm">
                {isRefreshing ? 'Refreshing...' : 'Loading...'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportJSON}
            disabled={filteredSubmissions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search submissions by content, ID, or IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex space-x-1">
              {(['all', 'today', 'week', 'month'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={dateFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter(filter)}
                  className="text-xs"
                >
                  {filter === 'all' ? 'All Time' : 
                   filter === 'today' ? 'Today' :
                   filter === 'week' ? 'This Week' : 'This Month'}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {(debouncedSearchTerm || dateFilter !== 'all') && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </span>
            {debouncedSearchTerm && (
              <Badge variant="secondary">
                Search: "{debouncedSearchTerm}"
              </Badge>
            )}
            {dateFilter !== 'all' && (
              <Badge variant="secondary">
                {dateFilter === 'today' ? 'Today' :
                 dateFilter === 'week' ? 'This Week' : 'This Month'}
              </Badge>
            )}
          </div>
        )}
      </Card>
      
      {/* Virtualized submission list */}
      {filteredSubmissions.length === 0 && !isLoading ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {debouncedSearchTerm || dateFilter !== 'all' ? 'No Matching Submissions' : 'No Submissions Yet'}
          </h3>
          <p className="text-gray-500">
            {debouncedSearchTerm || dateFilter !== 'all' 
              ? 'Try adjusting your search criteria or date filter.'
              : 'When people submit your form, their responses will appear here for review and analysis.'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <VirtualizedSubmissionList
            submissions={filteredSubmissions}
            fields={fields}
            height={600}
          />
          
          {/* Load more button */}
          {pagination.hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  'Load More Submissions'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
