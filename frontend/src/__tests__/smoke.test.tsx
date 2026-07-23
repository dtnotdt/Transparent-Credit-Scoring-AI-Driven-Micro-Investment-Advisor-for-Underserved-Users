import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { ComplianceBanner } from '../components/ComplianceBanner';
import { GlassCard } from '../components/GlassCard';

describe('Frontend Smoke Tests', () => {
  it('renders ComplianceBanner with non-negotiable legal disclaimer', () => {
    render(<ComplianceBanner />);
    expect(
      screen.getByText(/educational purposes only and does not provide regulated financial/i)
    ).toBeInTheDocument();
  });

  it('renders GlassCard children correctly', () => {
    render(<GlassCard><div>Test Card Content</div></GlassCard>);
    expect(screen.getByText('Test Card Content')).toBeInTheDocument();
  });
});
