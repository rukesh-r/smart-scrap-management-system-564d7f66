# TODO: Enhance Dashboard with Analytics and Insights

## Overview & Insights Section
- [ ] Add Total Scrap Items Listed metric
- [ ] Add Total Earnings (Paid Transactions) metric
- [ ] Add Total Weight Sold metric
- [ ] Add Pending Payments Count metric
- [ ] Add This Month's Summary (items sold, revenue)
- [ ] Add small trend chart for sales growth

## Analytics & Reports Section
- [ ] Add category-wise scrap contribution pie chart
- [ ] Add Price vs Weight scatter chart
- [ ] Add Monthly earnings line graph
- [ ] Add export reports as PDF/CSV functionality

## Transaction & Payment Section
- [ ] List all transactions with item name, buyer, date, status
- [ ] Add filters for Pending, Paid, Failed
- [ ] Add Quick Pay Now or Mark as Paid buttons
- [ ] Add total earnings summary

## User Profile Widget
- [ ] Add user name, profile photo, location
- [ ] Add Member since date
- [ ] Add role badge (Seller/Buyer)
- [ ] Add quick links: Edit profile, View listings, Logout

## Dependencies
- [ ] Install recharts for charts
- [ ] Install jsPDF for PDF export

## Implement Detailed Login History
- [x] Update `src/integrations/supabase/types.ts` to include login_history table schema
- [x] Add "Login History" section to `src/components/settings/SecuritySettings.tsx` with table display
- [x] Implement data fetching for login history with loading states
- [x] Add proper error handling for login history display
