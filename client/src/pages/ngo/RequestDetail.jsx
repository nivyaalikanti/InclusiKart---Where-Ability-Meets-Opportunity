import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AssignmentTurnedIn as AssignIcon,
  CheckCircle as FulfillIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as CategoryIcon,
  PriorityHigh as PriorityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import SellerInfoCard from '../../components/NGO/SellerInfoCard';
import { 
  getHelpRequestDetails, 
  updateRequestStatus,
  fulfillRequest 
} from '../../utils/ngoAPI';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`request-tabpanel-${index}`}
      aria-labelledby={`request-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [statusData, setStatusData] = useState({
    status: '',
    notes: ''
  });
  const [fulfillData, setFulfillData] = useState({
    notes: '',
    files: []
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await getHelpRequestDetails(id);
      setRequest(response.data.helpRequest);
      setSellerStats(response.data.sellerStats);
    } catch (err) {
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setActionLoading(true);
      await updateRequestStatus(id, statusData.status, statusData.notes);
      await fetchRequestDetails();
      setStatusDialogOpen(false);
      setStatusData({ status: '', notes: '' });
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async () => {
    try {
      setActionLoading(true);
      await fulfillRequest(id, { notes: fulfillData.notes }, fulfillData.files);
      await fetchRequestDetails();
      setFulfillDialogOpen(false);
      setFulfillData({ notes: '', files: [] });
    } catch (err) {
      setError(err.message || 'Failed to mark as fulfilled');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFulfillData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index) => {
    setFulfillData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const getStatusActions = () => {
    if (!request) return [];

    const actions = [];
    const isAssignedToMe = request.ngoAssigned?._id === localStorage.getItem('ngoUserId');

    if (!isAssignedToMe && request.status === 'pending') {
      actions.push({
        label: 'Take Request',
        color: 'primary',
        icon: <AssignIcon />,
        onClick: () => {
          setStatusData({ status: 'under_review', notes: '' });
          setStatusDialogOpen(true);
        }
      });
    }

    if (isAssignedToMe) {
      switch (request.status) {
        case 'under_review':
          actions.push({
            label: 'Start Work',
            color: 'primary',
            icon: <PendingIcon />,
            onClick: () => {
              setStatusData({ status: 'in_progress', notes: '' });
              setStatusDialogOpen(true);
            }
          });
          break;
        case 'in_progress':
          actions.push({
            label: 'Mark as Fulfilled',
            color: 'success',
            icon: <FulfillIcon />,
            onClick: () => setFulfillDialogOpen(true)
          });
          break;
      }

      // Add cancel/reject option for under_review and in_progress
      if (['under_review', 'in_progress'].includes(request.status)) {
        actions.push({
          label: 'Cancel Request',
          color: 'error',
          icon: <CancelIcon />,
          onClick: () => {
            setStatusData({ status: 'rejected', notes: '' });
            setStatusDialogOpen(true);
          }
        });
      }
    }

    return actions;
  };

  const getTypeLabel = (type) => {
    const types = {
      raw_materials: 'Raw Materials',
      financial: 'Financial Assistance',
      training: 'Training/Workshop',
      equipment: 'Equipment/Tools',
      marketing: 'Marketing Support',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      under_review: 'info',
      in_progress: 'primary',
      fulfilled: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'success'
    };
    return colors[urgency] || 'default';
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

  if (error || !request) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Request not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ngo/requests')}
        >
          Back to Requests
        </Button>
      </Container>
    );
  }

  const statusActions = getStatusActions();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ngo/requests')}
          sx={{ mb: 2 }}
        >
          Back to Requests
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {request.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={request.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(request.status)}
                size="small"
              />
              <Chip
                label={request.urgencyLevel.toUpperCase()}
                color={getUrgencyColor(request.urgencyLevel)}
                size="small"
                icon={<PriorityIcon />}
              />
              <Chip
                label={getTypeLabel(request.requestType)}
                variant="outlined"
                size="small"
              />
            </Stack>
          </Box>

          {statusActions.length > 0 && (
            <Stack direction="row" spacing={1}>
              {statusActions.map((action, index) => (
                <Button
                  key={index}
                  variant="contained"
                  color={action.color}
                  startIcon={action.icon}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Request Details */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Request Details" />
              <Tab label="Attachments" />
              <Tab label="Fulfillment Details" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Basic Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {getTypeLabel(request.requestType)}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1">
                      {request.category}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body1">
                      {request.quantity} {request.unit}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estimated Value
                    </Typography>
                    <Typography variant="body1">
                      ₹{request.estimatedValue?.toLocaleString() || 'Not specified'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Deadline
                    </Typography>
                    <Typography variant="body1">
                      {request.deadline ? format(new Date(request.deadline), 'PPP') : 'Not specified'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(request.createdAt), 'PPP')}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {request.description}
                  </Typography>
                </Paper>
              </Box>

              {/* Notes */}
              {request.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Additional Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">
                      {request.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Assigned NGO */}
              {request.ngoAssigned && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Assigned NGO
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {request.ngoAssigned.ngoName || request.ngoAssigned.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.ngoAssigned.email}
                          </Typography>
                          {request.ngoAssigned.phone && (
                            <Typography variant="body2" color="text.secondary">
                              {request.ngoAssigned.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </TabPanel>

            {/* Attachments Tab */}
            <TabPanel value={tabValue} index={1}>
              {request.attachments?.length > 0 ? (
                <Grid container spacing={2}>
                  {request.attachments.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AttachFileIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" noWrap>
                              {file.fileName}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View File
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No attachments found
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Fulfillment Tab */}
            <TabPanel value={tabValue} index={2}>
              {request.fulfillmentDetails ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Fulfilled By
                        </Typography>
                        <Typography variant="body1">
                          {request.fulfillmentDetails.fulfilledBy?.ngoName || 
                           request.fulfillmentDetails.fulfilledBy?.name || 
                           'N/A'}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Fulfillment Date
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(request.fulfillmentDetails.fulfillmentDate), 'PPP')}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>

                  {request.fulfillmentDetails.notes && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Fulfillment Notes
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body1">
                          {request.fulfillmentDetails.notes}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {request.fulfillmentDetails.proofOfFulfillment?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Proof of Fulfillment
                      </Typography>
                      <Grid container spacing={2}>
                        {request.fulfillmentDetails.proofOfFulfillment.map((file, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <AttachFileIcon sx={{ mr: 1, color: 'success.main' }} />
                                  <Typography variant="body2" noWrap>
                                    {file.fileName}
                                  </Typography>
                                </Box>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  fullWidth
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Proof
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    This request has not been fulfilled yet
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>

        {/* Right Column - Seller Info */}
        <Grid item xs={12} lg={4}>
          <SellerInfoCard seller={request.seller} stats={sellerStats} />
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Request Status</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Status Notes (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={statusData.notes}
            onChange={(e) => setStatusData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fulfill Request Dialog */}
      <Dialog open={fulfillDialogOpen} onClose={() => setFulfillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Request as Fulfilled</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Fulfillment Notes"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={fulfillData.notes}
            onChange={(e) => setFulfillData(prev => ({ ...prev, notes: e.target.value }))}
            helperText="Describe how the request was fulfilled"
          />
          
          <Box sx={{ mt: 2, mb: 1 }}>
            <input
              type="file"
              id="fulfillment-files"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label htmlFor="fulfillment-files">
              <Button
                component="span"
                startIcon={<AttachFileIcon />}
                variant="outlined"
              >
                Add Proof Files
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              Upload proof of fulfillment (receipts, photos, etc.)
            </Typography>
          </Box>

          {/* File List */}
          {fulfillData.files.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {fulfillData.files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'grey.100',
                    p: 1,
                    mt: 1,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeFile(index)}
                    color="error"
                  >
                    <CancelIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFulfillDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFulfill} 
            color="success"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Mark as Fulfilled'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RequestDetail;