# Pet NFC App Design System

## Typography System

### CSS Classes Available

#### Section Titles
- `.section-title` - Standard section headings (text-xl font-bold, brand-900 color)
- `.section-title-inverse` - Section headings on dark backgrounds (text-xl font-bold, white color)
- `.section-subtitle` - Secondary headings (text-lg font-semibold, brand-800 color)

#### Body Text
- `.body-text` - Standard body text (text-base, brand-700 color)
- `.body-text-muted` - Muted/secondary text (text-sm, brand-600 color)

### Usage Examples
```tsx
// Standard section heading
<h2 className="section-title">Owner Information</h2>

// Section heading on dark background
<h2 className="section-title-inverse">Recent Posts</h2>

// Body text
<div className="body-text">Contact information here</div>

// Muted text for labels
<div className="body-text-muted font-medium">Mobile</div>
```

## Layout System

### CSS Classes Available

#### Section Layout
- `.section-container` - Standard section margin bottom (mb-6)
- `.section-padding` - Standard section padding (px-6 py-4)
- `.section-header-spacing` - Standard spacing below section headers (mb-4)
- `.content-spacing` - Standard content vertical spacing (space-y-4)

### Usage Examples
```tsx
// Standard section layout
<section className="section-container section-padding">
  <SectionHeader title="Title" emoji="📱" />
  <div className="content-spacing">
    {/* Content here */}
  </div>
</section>
```

## Components

### SectionHeader Component

Standardized section header component for consistent styling across the app.

#### Props
```tsx
type SectionHeaderProps = {
  title: string;        // Section title text
  emoji?: string;       // Emoji icon for the section (optional)
  icon?: string;        // Path to SVG icon (optional, takes precedence over emoji)
  variant?: 'default' | 'inverse'; // Color variant
  className?: string;   // Additional CSS classes
};
```

#### Usage
```tsx
// Using SVG icons (preferred)
<SectionHeader 
  title="Owner Information" 
  icon="/icon/owner-info.svg"
  variant="default"
/>

<SectionHeader 
  title="Recent Posts" 
  icon="/icon/recent-post.svg"
  variant="inverse"
/>

// Using emojis (fallback)
<SectionHeader 
  title="Owner Information" 
  emoji="📞" 
  variant="default"
/>
```

## Implementation Guidelines

### Consistent Section Structure

All sections should follow this pattern:

```tsx
<section className="section-container [background-specific-classes]">
  <SectionHeader 
    title="Section Title" 
    emoji="🎯" 
    variant="default|inverse"
  />
  
  <div className="content-spacing">
    {/* Section content */}
  </div>
</section>
```

### Typography Hierarchy

1. **Page Title**: Custom styling (e.g., `text-3xl font-extrabold`)
2. **Section Headers**: Use `SectionHeader` component
3. **Subsection Headers**: Use `.section-subtitle` class
4. **Body Text**: Use `.body-text` class
5. **Labels/Muted Text**: Use `.body-text-muted` class

### Spacing Consistency

- **Section Margins**: Use `.section-container` for consistent vertical spacing
- **Section Padding**: Use `.section-padding` for internal content padding
- **Content Spacing**: Use `.content-spacing` for consistent vertical rhythm within sections

## Color System Integration

The typography system integrates with the existing brand color palette:

- `--brand-900`: Primary text color (darkest)
- `--brand-800`: Subtitle color
- `--brand-700`: Body text color
- `--brand-600`: Muted text color

## Migration Guide

### Updating Existing Components

1. Replace custom section headers with `SectionHeader` component
2. Replace inline text styling with design system classes
3. Apply consistent section layout classes
4. Ensure proper color variant usage (default vs inverse)

### Before/After Example

**Before:**
```tsx
<div className="flex items-center gap-2 mb-4">
  <span className="text-xl">📞</span>
  <h2 className="text-xl font-extrabold" style={{ color: "var(--brand-900)" }}>
    Owner Infomation
  </h2>
</div>
```

**After:**
```tsx
<SectionHeader 
  title="Owner Information" 
  emoji="📞" 
  variant="default"
/>
```

This design system ensures consistent typography, spacing, and layout patterns throughout the Pet NFC application.
