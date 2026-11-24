import { Box, type SxProps, type Theme } from '@mui/material';

/**
 * The signature photo treatment: grayscale, purple duotone tint and CRT-style scanlines.
 * Fills its (positioned) parent; pass a `maskImage` in `sx` to fade it into the page.
 */
export function DuotonePhoto({ src, position = 'center', sx }: { src: string; position?: string; sx?: SxProps<Theme> }) {
  return (
    <Box aria-hidden sx={[{ position: 'absolute', inset: 0, overflow: 'hidden' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: position,
          filter: 'grayscale(1) contrast(1.2) brightness(0.85)',
        }}
      />
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#6b4fa8', mixBlendMode: 'color', opacity: 0.55 }} />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(10,10,20,0.35) 0px, rgba(10,10,20,0.35) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </Box>
  );
}
