import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  Stack,
  Button,
  CardActions,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as CategoryIcon,
  PriorityHigh as PriorityIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const urgencyColors = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'success'
};

const statusColors = {
  pending: 'default',
  under_review: 'info',
  in_progress: 'primary',
  fulfilled: 'success',
  rejected: 'error'
};

const RequestCard = ({ request, onViewDetails, onAssign }) => {
  const {
    _id,
    title,
    description,
    urgencyLevel,
    status,
    requestType,
    category,
    createdAt,
    seller,
    ngoAssigned
  } = request;

  const getTypeLabel = (type) => {
    const types = {
      raw_materials: 'Raw Materials',
      financial: 'Financial',
      training: 'Training',
      equipment: 'Equipment',
      marketing: 'Marketing',
      other: 'Other'
    };
    return types[type] || type;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const isAssignedToMe = ngoAssigned?._id === localStorage.getItem('ngoUserId');

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header with title and urgency */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {title}
          </Typography>
          <Chip
            label={urgencyLevel.toUpperCase()}
            color={urgencyColors[urgencyLevel] || 'default'}
            size="small"
            icon={<PriorityIcon />}
          />
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Seller Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={seller?.profileImage}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {seller?.businessName || seller?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {seller?.email}
            </Typography>
          </Box>
        </Box>

        {/* Request Details */}
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              <strong>Type:</strong> {getTypeLabel(requestType)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              <strong>Category:</strong> {category}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimeIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              <strong>Submitted:</strong> {formatDate(createdAt)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      {/* Footer with actions */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {/* Status Chip */}
          <Chip
            label={status.replace('_', ' ').toUpperCase()}
            color={statusColors[status] || 'default'}
            size="small"
            variant="outlined"
          />

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onViewDetails(_id)}
            >
              View Details
            </Button>

            {status === 'pending' && !ngoAssigned && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => onAssign(_id)}
                disabled={isAssignedToMe}
              >
                {isAssignedToMe ? 'Assigned' : 'Take Request'}
              </Button>
            )}

            {isAssignedToMe && status === 'under_review' && (
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => onViewDetails(_id)}
              >
                Start Work
              </Button>
            )}
          </Stack>
        </Box>
      </CardActions>
    </Card>
  );
};

export default RequestCard;