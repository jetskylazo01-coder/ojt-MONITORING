<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>OJT Monitor - Sign In</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-tertiary-container": "#a6a8ff",
                    "on-surface-variant": "#464553",
                    "error-container": "#ffdad6",
                    "on-secondary-fixed": "#00201d",
                    "on-tertiary-fixed-variant": "#2f2ebe",
                    "on-primary": "#ffffff",
                    "on-tertiary": "#ffffff",
                    "on-secondary": "#ffffff",
                    "surface-dim": "#ccdbf3",
                    "on-tertiary-fixed": "#07006c",
                    "on-surface": "#0d1c2e",
                    "tertiary": "#0f009f",
                    "outline": "#777584",
                    "surface-tint": "#544fc0",
                    "background": "#f8f9ff",
                    "tertiary-fixed-dim": "#c0c1ff",
                    "on-secondary-fixed-variant": "#005049",
                    "primary": "#1f108e",
                    "inverse-on-surface": "#eaf1ff",
                    "on-primary-fixed-variant": "#3b35a7",
                    "surface-bright": "#f8f9ff",
                    "on-primary-fixed": "#0f0069",
                    "on-error-container": "#93000a",
                    "inverse-primary": "#c3c0ff",
                    "secondary-fixed-dim": "#6bd8cb",
                    "secondary-fixed": "#89f5e7",
                    "primary-container": "#3730a3",
                    "on-secondary-container": "#006f66",
                    "secondary-container": "#86f2e4",
                    "tertiary-container": "#2a28bb",
                    "secondary": "#006a61",
                    "on-primary-container": "#a9a7ff",
                    "on-error": "#ffffff",
                    "primary-fixed": "#e2dfff",
                    "outline-variant": "#c8c4d5",
                    "on-background": "#0d1c2e",
                    "surface-container": "#e6eeff",
                    "surface-variant": "#d5e3fc",
                    "surface-container-high": "#dce9ff",
                    "surface": "#f8f9ff",
                    "inverse-surface": "#233144",
                    "tertiary-fixed": "#e1e0ff",
                    "primary-fixed-dim": "#c3c0ff",
                    "surface-container-low": "#eff4ff",
                    "surface-container-highest": "#d5e3fc",
                    "surface-container-lowest": "#ffffff",
                    "error": "#ba1a1a"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "lg": "24px",
                    "gutter": "12px",
                    "base": "4px",
                    "xl": "32px",
                    "md": "16px",
                    "xs": "4px",
                    "sm": "8px",
                    "container-margin": "16px"
            },
            "fontFamily": {
                    "display-lg": ["Hanken Grotesk"],
                    "label-md": ["Hanken Grotesk"],
                    "body-md": ["Hanken Grotesk"],
                    "body-lg": ["Hanken Grotesk"],
                    "title-md": ["Hanken Grotesk"],
                    "label-sm": ["Hanken Grotesk"],
                    "headline-sm": ["Hanken Grotesk"],
                    "headline-md": ["Hanken Grotesk"]
            },
            "fontSize": {
                    "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "title-md": ["18px", {"lineHeight": "24px", "fontWeight": "500"}],
                    "label-sm": ["11px", {"lineHeight": "14px", "fontWeight": "500"}],
                    "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
            }
          },
        },
      }
    </script>
<style>
        body {
            font-family: 'Hanken Grotesk', sans-serif;
            background-color: #f8f9ff;
            background-image: 
                radial-gradient(at 0% 0%, #ccdbf3 0px, transparent 50%),
                radial-gradient(at 100% 100%, #e2dfff 0px, transparent 50%);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-md">
<!-- Top Navigation (Suppressed based on Transactional Rule, but using TopAppBar components for branding) -->
<main class="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">
<!-- Brand Logo Area -->
<div class="flex flex-col items-center mb-xl">
<div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-md shadow-lg shadow-primary/20">
<span class="material-symbols-outlined text-on-primary text-[28px]" style="font-variation-settings: 'FILL' 1;">monitoring</span>
</div>
<h1 class="font-headline-md text-headline-md text-primary tracking-tight">OJT Monitor</h1>
</div>
<!-- Login Card -->
<div class="glass-card rounded-xl p-lg shadow-sm">
<div class="mb-lg">
<h2 class="font-headline-sm text-headline-sm text-on-surface">Welcome Back</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-xs">Please enter your details to sign in.</p>
</div>
<form class="space-y-md" onsubmit="return false;">
<!-- Email Field -->
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" for="email">Email Address</label>
<div class="relative">
<span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">mail</span>
<input class="w-full pl-[44px] pr-md py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-md text-body-md bg-surface-container-lowest outline-none" id="email" name="email" placeholder="name@company.com" type="email"/>
</div>
</div>
<!-- Password Field -->
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" for="password">Password</label>
<div class="relative">
<span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock</span>
<input class="w-full pl-[44px] pr-[44px] py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-md text-body-md bg-surface-container-lowest outline-none" id="password" name="password" placeholder="••••••••" type="password"/>
<button class="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant" type="button">
<span class="material-symbols-outlined">visibility</span>
</button>
</div>
</div>
<!-- Remember & Forgot -->
<div class="flex items-center justify-between">
<label class="flex items-center cursor-pointer group">
<input class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="ml-sm font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">Remember Me</span>
</label>
<a class="font-label-md text-label-md text-primary hover:text-tertiary-container transition-colors font-bold" href="#">Forgot Password?</a>
</div>
<!-- Sign In Button -->
<button class="w-full bg-primary text-on-primary py-3.5 rounded-full font-title-md text-title-md hover:bg-primary-container active:scale-[0.98] transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-sm" type="submit">
                    Sign In
                    <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
<!-- Divider -->
<div class="relative py-md">
<div class="absolute inset-0 flex items-center">
<div class="w-full border-t border-outline-variant/50"></div>
</div>
<div class="relative flex justify-center">
<span class="px-md bg-surface-container-lowest text-label-sm text-outline font-label-sm uppercase tracking-widest">Or continue with</span>
</div>
</div>
<!-- Google Sign In -->
<button class="w-full flex items-center justify-center gap-md py-3 border border-outline-variant rounded-full font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors active:scale-[0.98]" type="button">
<svg class="w-5 h-5" viewbox="0 0 24 24">
<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
</svg>
                    Sign in with Google
                </button>
</form>
</div>
<!-- Footer Link -->
<p class="text-center mt-lg font-body-md text-body-md text-on-surface-variant">
            Don't have an account? 
            <a class="text-primary font-bold hover:underline underline-offset-4 decoration-2 decoration-primary-container" href="#">Request Access</a>
</p>
<!-- Aesthetic Decoration (Subtle background elements) -->
<div class="fixed top-0 right-0 w-64 h-64 overflow-hidden pointer-events-none opacity-50">
<div class="absolute -top-12 -right-12 w-full h-full rounded-full border-[32px] border-secondary-container/20"></div>
</div>
<div class="fixed bottom-0 left-0 w-48 h-48 overflow-hidden pointer-events-none opacity-50">
<div class="absolute -bottom-8 -left-8 w-full h-full rounded-full bg-primary-container/10"></div>
</div>
</main>
<script>
        // Simple micro-interaction for input fields
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.querySelector('.material-symbols-outlined').style.color = 'var(--primary)';
                input.parentElement.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
            });
            input.addEventListener('blur', () => {
                input.parentElement.querySelector('.material-symbols-outlined').style.color = 'var(--outline)';
                input.parentElement.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 0";
            });
        });
    </script>
</body></html>