<template>
    <main id="about" class="max-lg:p-8 relative col-span-full lg:col-span-3 row-span-full space-y-8 lg:overflow-auto">
        <svg aria-hidden="true" class="absolute w-0 h-0 overflow-hidden" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                <symbol id="icon-email" viewBox="0 0 24 24">
                    <title>Email</title>
                    <path d="M19.424999999999997 8.5725H24v1.1400000000000001h-4.574999999999999Z" stroke-width="0.75"></path>
                    <path d="M21.7125 10.86H24V12h-2.2874999999999996Z" stroke-width="0.75"></path>
                    <path d="m6.855 16.575000000000003 5.715 0 0 1.1400000000000001 5.715 0 0 -2.2874999999999996 3.4275 0 0 -2.2800000000000002 -1.1400000000000001 0 0 1.1400000000000001 -19.4325 0 0 -1.1400000000000001 -1.1400000000000001 0 0 2.2800000000000002 6.855 0 0 1.1475z" stroke-width="0.75"></path>
                    <path d="M18.285 12h2.2874999999999996v1.1475h-2.2874999999999996Z" stroke-width="0.75"></path>
                    <path d="M17.137500000000003 6.285h2.2874999999999996v1.1475h-2.2874999999999996Z" stroke-width="0.75"></path>
                    <path d="M15.997499999999999 10.86h2.2874999999999996V12h-2.2874999999999996Z" stroke-width="0.75"></path>
                    <path d="m13.71 9.712499999999999 -1.1400000000000001 0 0 1.1475 3.4275 0 0 -1.1475 -1.1400000000000001 0 0 -1.1400000000000001 -1.1475 0 0 1.1400000000000001z" stroke-width="0.75"></path>
                    <path d="m14.857499999999998 8.5725 1.1400000000000001 0 0 -2.2874999999999996 -3.4275 0 0 1.1475 2.2874999999999996 0 0 1.1400000000000001z" stroke-width="0.75"></path>
                    <path d="M10.2825 7.4325h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z" stroke-width="0.75"></path>
                    <path d="M9.1425 10.86h3.4275V12h-3.4275Z" stroke-width="0.75"></path>
                    <path d="M7.995 8.5725h2.2874999999999996v1.1400000000000001h-2.2874999999999996Z" stroke-width="0.75"></path>
                    <path d="M5.715 9.712499999999999h2.2800000000000002v1.1475H5.715Z" stroke-width="0.75"></path>
                    <path d="M3.4275 10.86h2.2874999999999996V12H3.4275Z" stroke-width="0.75"></path>
                    <path d="M1.1400000000000001 12h2.2874999999999996v1.1475H1.1400000000000001Z" stroke-width="0.75"></path>
                </symbol>
            </defs>
        </svg>
  
        <h1 class="sr-only">About</h1>
                
        <p class="cursor-text">Hi, I&rsquo;m Ethan! I am a graphic designer and developer with over 10 years of experience in branding and storytelling, user interface design, frontend web development and web-based animation. I&rsquo;ve done work for clients big and small, from corporate to independent, and everything in between. Check out my credentials below or send me a message <a href="mailto:ethanjhead@gmail.com" class="cursor-pointer inline-block align-bottom -scale-x-100" data-audio="open"><span class="sr-only">Email ethanjhead@gmail.com</span><svg id="paper-plane" class="size-6 text-(--color-highlight) fill-current will-change-transform"><use xlink:href="#icon-email"></use></svg></a></p>

        <details class="group cursor-text flex flex-col">
            
        <summary class="cursor-pointer" data-audio="select">View Resume</summary>

        <h2 class="uppercase mt-6 mb-2">Education</h2>
        <p>Bachelor of Fine Arts with Emphasis in Graphic Design<br>2008-2012 | Mississippi State University | Cum Laude</p>
        
        <h2 class="uppercase mt-6 mb-2">Work Experience</h2>
        <ul class="space-y-4">
            <li class="space-y-1">
            <h3 class="[font-variant-caps:all-small-caps]">Mad Genius | Ridgeland, MS</h3>
            <ul class="list-[square] pl-8 space-y-2">
                    <li>
                    <h4>Interactive Art Director | 2018-Present</h4>
                    <p>Responsibilities include leading user interface design on a diverse array of client work, creating engaging digital storytelling experiences, coding responsive, animated, front-end web applications, and building custom Wordpress templates.</p>
                    </li>
                    <li>
                    <h4>Web Designer | 2014-2018</h4>
                    <p>Responsibilities included designing user interfaces for a diverse array of client work, coding responsive, front-end web applications, and building custom Wordpress templates.</p>
                    </li>
            </ul>
            </li>
    
            <li class="space-y-1">
            <h3 class="[font-variant-caps:all-small-caps]">Addison Hall Design | Flowood, MS</h3>
            <ul class="list-[square] pl-8 space-y-2">
                    <li>
                    <h4>Web Designer | 2012-2014</h4>
                    <p>Responsibilities included designing user interfaces for a diverse array of client work and coding responsive, front-end web applications.</p>
                    </li>
            </ul>
            </li>
        </ul>
        
        <h2 class="uppercase mt-6 mb-2">Technical Skills</h2>
        <p>I am proficient in the usual design software like Figma, XD, Illustrator and Photoshop. I&rsquo;m fluent in HTML, CSS, and JS. I am, also, intimately familar with Greensock Animation Platform (GSAP), Wordpress and Tailwind.</p> 
        
        </details>
    </main>
</template>
