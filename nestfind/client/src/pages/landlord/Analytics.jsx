// nestfind/nestfind/client/src/pages/landlord/Analytics.jsx

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RevenueChart from '../../components/landlord/RevenueChart';
import OccupancyDonut from '../../components/landlord/OccupancyDonut';
import StatCard from '../../components/ui/StatCard';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import SEO from '../../components/common/SEO';
import landlordApi from '../../api/landlordApi';
import { formatCurrency } from '../../utils