import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import RequestCard from '../../components/NGO/RequestCard';
import { getAllHelpRequests, assignHelpRequest } from '../../utils/ngoAPI';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'rejected', label: 'Rejected' }
];

const urgencyOptions = [
  { value: 'all', label: 'All Urgency' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const requestTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'raw_materials', label: 'Raw Materials' },
  { value: 'financial', label: 'Financial' },
  { value: 'training', label: 'Training' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' }
];

const NGORequests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    requestType: searchParams.get('requestType') || 'all',
    urgencyLevel: searchParams.get('urgencyLevel') || 'all',
    assignedToMe: searchParams.get('assignedToMe') || 'false',
    page: parseInt(searchParams.get('page')) || 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 20
  });
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchRequests();
  }, [filters.page]);

  useEffect(() => {
    // Update URL when filters change
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'false') {
        params[key] = value;
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: filters.page,
        limit: pagination.limit
      };
      
      // Remove 'all' values
      Object.keys(params).forEach(key => {
        if (params[key] === 'all' || params[key] === '') {
          delete params[key];
        }
      });

      const response = await getAllHelpRequests(params);
      setRequests(response.data);
      setPagination(response.pagination);
      setStats(response.stats || {});
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  const handleAssignRequest = async (requestId) => {
    try {
      const response = await assignHelpRequest(requestId);
      if (response.success) {
        // Refresh the requests list
        fetchRequests();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign request');
    }
  };

  const handleViewDetails = (requestId) => {
    window.location.href = `/ngo/requests/${requestId}`;
  };

  const handlePageChange = (event, value) => {
    handleFilterChange('page', value);
    window.scrollTo(0, 0);
  };

  const refreshData = () => {
    fetchRequests();
  };

  // Calculate active filters count
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key];
    return value && value !== 'all' && value !== 'false' && value !== '';
  }).length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Help Requests
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Browse and manage help requests from sellers
        </Typography>
      </Box>

      {/* Stats Bar */}
      {Object.keys(stats).length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(stats).map(([status, count]) => (
              <Box key={status} sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {status.replace('_', ' ')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search requests..."
              value={filters.search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.requestType}
                onChange={(e) => handleFilterChange('requestType', e.target.value)}
                label="Type"
              >
                {requestTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filters.urgencyLevel}
                onChange={(e) => handleFilterChange('urgencyLevel', e.target.value)}
                label="Urgency"
              >
                {urgencyOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Assignment</InputLabel>
              <Select
                value={filters.assignedToMe}
                onChange={(e) => handleFilterChange('assignedToMe', e.target.value)}
                label="Assignment"
              >
                <MenuItem value="false">Unassigned</MenuItem>
                <MenuItem value="true">Assigned to Me</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Active filters: {activeFiltersCount}
            </Typography>
            <Button
              size="small"
              onClick={() => setFilters({
                search: '',
                status: 'all',
                requestType: 'all',
                urgencyLevel: 'all',
                assignedToMe: 'false',
                page: 1
              })}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Results Count */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Showing {requests.length} of {pagination.total} requests
            </Typography>
            <Chip
              label={`Page ${filters.page} of ${pagination.pages}`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Requests Grid */}
          {requests.length > 0 ? (
            <>
              <Grid container spacing={3}>
                {requests.map((request) => (
                  <Grid item xs={12} sm={6} md={4} key={request._id}>
                    <RequestCard
                      request={request}
                      onViewDetails={handleViewDetails}
                      onAssign={handleAssignRequest}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.pages}
                    page={filters.page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          ) : (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No requests found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your filters or check back later
              </Typography>
              <Button
                variant="contained"
                onClick={() => setFilters({
                  search: '',
                  status: 'all',
                  requestType: 'all',
                  urgencyLevel: 'all',
                  assignedToMe: 'false',
                  page: 1
                })}
              >
                Clear Filters
              </Button>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default NGORequests;