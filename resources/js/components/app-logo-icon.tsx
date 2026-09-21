import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return <img src="/images/grc-icon.png" alt="GRC LMS Logo" {...props} />;
}
