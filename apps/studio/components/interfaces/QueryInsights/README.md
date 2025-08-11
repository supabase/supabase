# QueryInsights Slow Query Tracking

## Overview

The QueryInsights interface now includes slow query tracking functionality that allows users to monitor and analyze queries that might have performance issues.

## Features

### New "Issues" Tab

- **Slow Query Metrics**: Shows the count of queries with performance issues over time
- **Slow Query Details**: Displays queries that might have problems based on execution time
- **Slow Query Filtering**: Automatically filters to show only queries with potential performance issues when the Issues tab is selected

### Slow Query Information Display

The QueryList component now includes a "Slow Queries" column that shows:
- **No issues**: Green badge for queries without performance issues
- **Slow query count**: Red badge showing the number of slow queries

### Data Structure

The `QueryInsightsQuery` type has been extended with slow query tracking fields:
- `error_count`: Total number of slow queries for the query

## Implementation Details

### Slow Query Detection Logic

The system detects potential performance issues using the following criteria:
- Queries with mean execution time > 1000ms and multiple calls
- This helps identify queries that are consistently slow and might need optimization

### Database Queries

1. **Main Query**: Updated `getQueriesSql` to include slow query information from `pg_stat_monitor`
2. **Slow Queries Query**: New `getQueriesWithErrorsSql` function that filters for queries with performance issues
3. **Slow Query Metrics**: New SQL case for tracking slow query counts over time

### API Functions

- `useQueryInsightsQueriesWithErrors`: Hook to fetch queries with performance issues
- Updated cache management to include slow query data
- Pre-fetching support for slow query-related queries

### UI Components

- Added "Issues" tab to the main QueryInsights interface
- Extended QueryList with slow queries column
- Dynamic loading states for slow query data

## Usage

1. Navigate to the QueryInsights page
2. Select the "Issues" tab to view queries with potential performance issues
3. The slow query count is displayed in the tab description
4. Slow query details are shown in the "Slow Queries" column of the query list

## Slow Query Detection

The system tracks potential performance issues using:
- `mean_exec_time > 1000 AND calls > 1`: Queries that are consistently slow
- This approach helps identify queries that might need optimization or indexing

## Future Enhancements

- More sophisticated performance issue detection algorithms
- Performance issue severity classification
- Performance trend analysis
- Optimization suggestions
- Integration with alerting systems 