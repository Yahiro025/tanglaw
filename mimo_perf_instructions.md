# MiMo 2.5 Implementation Prompt: Scroll Performance Optimization

**Context**: You are MiMo 2.5, an expert AI coding assistant. Your task is to implement a series of performance optimizations to resolve scroll lag and high CPU usage in a Next.js / React application.

**CRITICAL DIRECTIVE - ZERO VISUAL COMPROMISE**: 
Every fix MUST preserve the exact same visual output, animations, and behavior. Your changes must be purely implementation-level (better algorithms, smarter lifecycle management, reduced unnecessary work, and rate-limiting). Do NOT remove UI elements, do NOT simplify the visual design, and do NOT remove CSS effects unless you are explicitly replacing them with an exact visual equivalent.

Please implement the following 7 tasks sequentially. After completing each task, verify your changes before moving to the next.

---

### Task 1: NatureCanvas — Spatial hashing for connection lines
**File**: `frontend/src/components/nature-canvas.tsx`
**Goal**: Reduce the $O(n^2)$ particle distance calculation to $O(n)$ using a spatial grid.
**Instructions**:
1. Locate the nested `for` loops (around lines 618-650) that compute pairwise distances between ALL particles.
2. Implement a **spatial grid** (cell-based bucketing) approach.
3. Divide the canvas into cells of size equal to the `connectionDist` (e.g., 100px).
4. On each frame, populate the grid mapping each cell key (e.g., `x_y`) to an array of particle indices.
5. Replace the nested loop so that each particle only checks for neighbors within its own cell and the 8 directly adjacent cells.
6. Ensure the visual result (connection lines drawing based on distance) is exactly identical.

---

### Task 2: EtheralShadow — RAF-throttled SVG filter updates
**File**: `frontend/components/ui/etheral-shadow.tsx`
**Goal**: Prevent the SVG `<animate>` element from running at the browser's compositing rate, which is heavily taxing.
**Instructions**:
1. Remove the SVG `<animate>` element currently driving the `feColorMatrix` hue rotation (around lines 93-99).
2. Set up a `useRef` to track the hue value and another `useRef` attached to the `feColorMatrix` element.
3. Implement a manual `requestAnimationFrame` (RAF) loop in a `useEffect`.
4. Throttle the RAF loop to update the `values` attribute of the `feColorMatrix` every 3rd frame (approx 20fps).
5. Increment the hue by 2 degrees on each update, wrapping at 360.
6. Pause the RAF loop completely when the element is not in the viewport using an `IntersectionObserver`.

---

### Task 3: MascotWithGlow — Viewport-gated animation pausing
**File**: `frontend/components/ui/landing-animations.tsx`
**Goal**: Stop Framer Motion elements from continuously animating (and calculating) when scrolled off-screen.
**Instructions**:
1. Locate the 3 `motion.div` elements (around lines 50-81) that use `whileInView` + `viewport={{ once: false }}` + `repeat: Infinity`.
2. Keep the animation definitions exactly as-is.
3. Wrap the `MascotWithGlow` component's contents in a single `IntersectionObserver` hook.
4. When the component scrolls out of view, apply the CSS property `animationPlayState: 'paused'` to the animated elements.
5. When it scrolls back into view, set it to `animationPlayState: 'running'`.
6. Ensure this pauses the animation without resetting its state, saving CPU cycles when off-screen.

---

### Task 4: ScrollReveal — Shared IntersectionObserver
**File**: `frontend/src/components/scroll-reveal.tsx`
**Goal**: Reduce the overhead of having 20+ separate Framer Motion `IntersectionObserver` instances on pages like the About page.
**Instructions**:
1. Remove Framer Motion's `whileInView` logic from the individual `ScrollReveal` component.
2. Create a shared `ScrollRevealProvider` context that initializes a single, global `IntersectionObserver`.
3. Update the `ScrollReveal` component to register its ref with this global observer.
4. When the observer triggers, use standard CSS classes or React state to trigger the reveal animation once (`once: true` behavior).
5. Ensure the fade-in and slide animations retain their exact original timing and visual feel.

---

### Task 5: Dashboard layout — RAF-throttled scroll handler
**File**: `frontend/src/app/dashboard/layout.tsx`
**Goal**: Prevent the scroll event listener from causing layout thrashing with multiple state updates per frame.
**Instructions**:
1. Locate the `handleScroll` function (around lines 45-58) that calls `setAtTop` and `setScrolledAway`.
2. Wrap the logic inside `handleScroll` using `requestAnimationFrame`.
3. Use a `useRef` to track intermediate scroll values and to ensure you only commit to React state at animation frame boundaries (max 60 updates/sec).
4. Verify that the dashboard navbar auto-hide behavior remains perfectly responsive.

---

### Task 6: About page carousel — Component isolation
**File**: `frontend/src/app/about/about-client.tsx`
**Goal**: Stop the carousel's state updates from re-rendering the entire About page.
**Instructions**:
1. Extract the `CarouselSection` logic completely out of `about-client.tsx`.
2. Create a new file: `frontend/src/components/carousel-section.tsx`.
3. Move all carousel-specific state (like `setActiveIndex`) into this new component.
4. Import and use the standalone `CarouselSection` inside `about-client.tsx`.
5. Ensure all carousel behaviors (auto-scroll, dot navigation) work exactly as before.

---

### Task 7: GlowingText — Viewport-gated animation
**Files**: `frontend/src/app/globals.css` AND `frontend/components/ui/glowing-text.tsx`
**Goal**: Pause infinite `text-shadow` CSS animations when they are off-screen to save paint cycles.
**Instructions**:
1. In `globals.css`, add a utility class to pause animations: `.animate-glow-pause { animation-play-state: paused !important; }`.
2. In `glowing-text.tsx`, implement a standard `IntersectionObserver` to track viewport visibility.
3. Conditionally append the `.animate-glow-pause` class to the text span when the element is out of the viewport.
4. Ensure the text resumes its normal infinite glow pulse immediately when scrolling back into view.

---

### Final Verification
Run `npm run build` to ensure no type errors or missing imports were introduced.
Test the application to confirm:
- [ ] No visual elements are missing.
- [ ] The Mascot and background animations look identical but consume less CPU.
- [ ] Connection lines in the canvas still map correctly.
- [ ] The dashboard header still hides/shows smoothly on scroll.
