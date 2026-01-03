import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { helpRequestAPI } from '../../utils/api';

import './HelpRequestScoped.css';

const requestTypes = [
  { value: 'raw_materials', label: 'Raw Materials' },
  { value: 'financial', label: 'Financial Assistance' },
  { value: 'training', label: 'Training / Workshop' },
  { value: 'equipment', label: 'Equipment / Tools' },
  { value: 'marketing', label: 'Marketing Support' },
  { value: 'other', label: 'Other' }
];

const urgencyLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const HelpRequestForm = () => {
  const [formData, setFormData] = useState({
    requestType: '',
    category: '',
    title: '',
    description: '',
    urgencyLevel: 'medium',
    quantity: 1,
    unit: '',
    estimatedValue: '',
    deadline: null,
    notes: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => v && data.append(k, v));
      attachments.forEach(f => data.append('attachments', f));
      await helpRequestAPI.create(data);
      setSuccess('Request submitted successfully');
    } catch {
      setError('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="help-request-scope">
        <Paper className="help-request-card">

          <Typography variant="h5">Request Help</Typography>
          <Typography className="subtitle">
            Need assistance with raw materials, training, or other support? Submit a request here.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <form onSubmit={handleSubmit}>

            {/* Type */}
            <div className="form-row">
              <label>Type of Help Needed</label>
              <FormControl fullWidth size="small">
                <Select name="requestType" value={formData.requestType} onChange={handleChange}>
                  {requestTypes.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Category */}
            <div className="form-row">
              <label>Category *</label>
              <TextField size="small" fullWidth name="category" value={formData.category} onChange={handleChange} />
            </div>

            {/* Title */}
            <div className="form-row">
              <label>Request Title *</label>
              <TextField size="small" fullWidth name="title" value={formData.title} onChange={handleChange} />
            </div>

            {/* Urgency */}
            <div className="form-row">
              <label>Urgency Level</label>
              <FormControl fullWidth size="small">
                <Select name="urgencyLevel" value={formData.urgencyLevel} onChange={handleChange}>
                  {urgencyLevels.map(u => (
                    <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Description */}
            <div className="form-row">
              <label>Detailed Description *</label>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Quantity */}
            <div className="form-row">
              <label>Quantity</label>
              <div className="inline-fields">
                <TextField size="small" type="number" value={formData.quantity} />
                <TextField size="small" placeholder="kg / pcs" />
                <TextField size="small" placeholder="₹ Value" />
              </div>
            </div>

            {/* Deadline */}
            <div className="form-row">
              <label>Deadline</label>
              <DatePicker
                value={formData.deadline}
                onChange={(d) => setFormData(p => ({ ...p, deadline: d }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </div>

            {/* Notes */}
            <div className="form-row">
              <label>Additional Notes</label>
              <TextField size="small" fullWidth name="notes" value={formData.notes} onChange={handleChange} />
            </div>

            {/* Submit */}
            <div className="submit-row">
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Submit Request'}
              </Button>
            </div>

          </form>

        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default HelpRequestForm;
