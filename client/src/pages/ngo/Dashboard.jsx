import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Button,
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Emergency as EmergencyIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getNGODashboardStats } from '../../utils/ngoAPI';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const NGODashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getNGODashboardStats();
      setStats(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardStats}>
          Retry
        </Button>
      </Container>
    );
  }

  const capacityPercentage = stats?.capacity ? 
    (stats.capacity.currentlyHandling / stats.capacity.maxRequestsPerMonth) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          NGO Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the NGO portal. Help sellers grow their businesses.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assigned"
            value={stats?.totalAssigned || 0}
            icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats?.inProgress || 0}
            icon={<PendingIcon sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fulfilled"
            value={stats?.totalFulfilled || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Urgent"
            value={stats?.urgent || 0}
            icon={<EmergencyIcon sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Capacity Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Monthly Capacity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requests you can handle this month
            </Typography>
          </Box>
          <Chip
            label={stats?.capacity?.canTakeMore ? "Available" : "Full"}
            color={stats?.capacity?.canTakeMore ? "success" : "error"}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Current: {stats?.capacity?.currentlyHandling || 0}
            </Typography>
            <Typography variant="body2">
              Max: {stats?.capacity?.maxRequestsPerMonth || 10}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={capacityPercentage}
            color={capacityPercentage >= 90 ? "error" : capacityPercentage >= 70 ? "warning" : "success"}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Button
          variant="contained"
          onClick={() => navigate('/ngo/requests')}
          disabled={!stats?.capacity?.canTakeMore}
          startIcon={<AssignmentIcon />}
        >
          Take New Requests
        </Button>
      </Paper>

      {/* Focus Areas */}
      {stats?.focusAreas?.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Focus Areas
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {stats.focusAreas.map((area, index) => (
              <Chip
                key={index}
                label={area.replace('_', ' ')}
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Recent Requests */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Recent Requests
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/ngo/requests')}
          >
            View All
          </Button>
        </Box>

        {stats?.recentRequests?.length > 0 ? (
          <Grid container spacing={2}>
            {stats.recentRequests.map((request, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {request.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          By {request.seller?.businessName || request.seller?.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={request.status}
                          size="small"
                          color={
                            request.status === 'fulfilled' ? 'success' :
                            request.status === 'in_progress' ? 'primary' :
                            request.status === 'pending' ? 'warning' : 'default'
                          }
                        />
                        <Button
                          size="small"
                          onClick={() => navigate(`/ngo/requests/${request._id}`)}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>
                    {index < stats.recentRequests.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No recent requests
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/ngo/requests')}
            >
              Browse Requests
            </Button>
          </Box>
        )}
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/ngo/requests?status=pending')}
              >
                View Pending Requests
              </Button>
              <Button
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/ngo/requests?assignedToMe=true')}
              >
                My Assigned Requests
              </Button>
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                onClick={() => navigate('/ngo/requests?status=in_progress')}
              >
                In Progress Requests
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance
            </Typography>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h2" color="primary.main">
                {stats?.rating?.average?.toFixed(1) || '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Rating
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on {stats?.rating?.totalReviews || 0} reviews
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NGODashboard;