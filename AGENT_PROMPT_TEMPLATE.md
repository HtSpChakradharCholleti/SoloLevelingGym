# Agent Prompt Template for HotSpotMobile

Copy and paste this template when asking an agent to write code. Add your specific requirements.

---

## 🚀 For Component Generation

```
You are writing code for the HotSpotMobile React Native app.

IMPORTANT: Read and follow these project patterns EXACTLY:
- AGENT_INSTRUCTIONS.md - Your primary ruleset
- CODE_LOGIC_PATTERNS.md - Variable naming conventions
- CODE_STYLE_IDIOMS.md - Coding idioms and practices
- PATTERNS_AND_CONVENTIONS.md - Architecture and structure

TASK: [Your task here]

REQUIREMENTS:
- Use semantic variable names: isLoading, showPassword, hasRenew, etc.
- All colors from APP_CONFIG.COLOURS
- All sizes from APP_CONFIG.METRICS
- All fonts from APP_CONFIG.FONTS
- All text from strings.js (never hardcode)
- PropTypes and defaultProps on all reusable components
- JSDoc comment at top of component
- Class component (not hooks)
- StyleSheet.create() for styles
- Platform.select() for OS-specific code

TEMPLATE TO FOLLOW: [Copy relevant template from PATTERNS_AND_CONVENTIONS.md]

REFERENCE: See [specific section] in [specific document] for similar patterns.
```

---

## 🎯 For Screen/View Generation

```
You are writing a screen for the HotSpotMobile React Native app.

IMPORTANT: Read and follow these project patterns EXACTLY:
- AGENT_INSTRUCTIONS.md
- CODE_LOGIC_PATTERNS.md
- PATTERNS_AND_CONVENTIONS.md

TASK: [Your task here]

REQUIREMENTS:
- Wrap entire screen in <Wrapper> component with title prop
- Use semantic variable names
- All styling from APP_CONFIG
- All text from strings.js
- Handle loading states
- Handle error states with try/catch
- Use AsyncStorage for persistence
- Check global.isConnected before API calls
- PropTypes for received props

SCREEN TEMPLATE: [See "Screen Template" in PATTERNS_AND_CONVENTIONS.md]

DATA LOADING PATTERN: [See "Data Loading Pattern" in CODE_LOGIC_PATTERNS.md]
```

---

## 🔧 For Utility/Helper Generation

```
You are writing a utility function for the HotSpotMobile React Native app.

IMPORTANT: Read and follow these patterns:
- CODE_LOGIC_PATTERNS.md - Error handling & async patterns
- UTILITY_PATTERNS.md - Reference utility implementations
- CODE_STYLE_IDIOMS.md - Variable naming & type checking

TASK: [Your task here]

REQUIREMENTS:
- Always wrap in try/catch
- Log errors with function name and error object
- Provide fallback return values
- Add JSDoc comment with @param and @return
- Handle null/undefined inputs gracefully
- Return meaningful values (true/false, error string, or data object)
- Validate inputs before processing

EXAMPLE TO FOLLOW: [See relevant helper in UTILITY_PATTERNS.md]
```

---

## 🎨 For Styling Generation

```
You are applying styles to a HotSpotMobile React Native component.

IMPORTANT: Read and follow these patterns:
- CODE_STYLE_IDIOMS.md - Component styling patterns
- PATTERNS_AND_CONVENTIONS.md - AppConfig reference

REQUIREMENTS:
- Use conditional spread for style overrides (base + conditionals)
- All colors from APP_CONFIG.COLOURS.* (never hardcode)
- All sizes from APP_CONFIG.METRICS.* (never hardcode)
- Use StyleSheet.create() wrapping
- Use Platform.select() for iOS/Android differences
- Build styles step-by-step with conditional spreads

PATTERN TO FOLLOW:
[See "Component Styling Pattern" in CODE_STYLE_IDIOMS.md]
```

---

## 🔌 For API/Async Generation

```
You are writing an async API call for HotSpotMobile.

IMPORTANT: Read and follow these patterns:
- CODE_LOGIC_PATTERNS.md - Async/await patterns
- UTILITY_PATTERNS.md - Error handling and fallbacks

REQUIREMENTS:
- Get token from AsyncStorage
- Call APIManager with token and params
- Check response.success before using data
- Include try/catch block
- Provide fallback to AsyncStorage if API fails
- Log errors with: console.log(`ERROR: ${API.ENDPOINT}\n`, error)
- Return true/false or meaningful data

PATTERN TO FOLLOW:
[See "API Call Pattern" in CODE_LOGIC_PATTERNS.md]

FALLBACK PATTERN:
[See "API with AsyncStorage Fallback" in UTILITY_PATTERNS.md]
```

---

## 📋 For State Management

```
You are managing state in a HotSpotMobile component.

IMPORTANT: Read and follow these patterns:
- CODE_LOGIC_PATTERNS.md - State management patterns
- AGENT_INSTRUCTIONS.md - State management rules

REQUIREMENTS:
- Component state for LOCAL UI ONLY (loading, visibility, form input)
- Global state for APP-WIDE DATA (global.User, global.Cards, etc.)
- AsyncStorage for PERSISTENT DATA
- Immutable updates (map/spread, NEVER direct mutation)
- Don't duplicate global data in component state

3-LAYER APPROACH:
1. Global: global.User, global.Cities (app-wide)
2. AsyncStorage: tokens, cached API data (persistent disk)
3. Component state: isLoading, showPassword (local UI)

PATTERN TO FOLLOW:
[See "State Management Patterns" in CODE_LOGIC_PATTERNS.md]
```

---

## 💬 General Format

When asking agent for ANY code:

```
Context: [Brief description of what you're building]

CRITICAL: Follow these project patterns EXACTLY:
1. Read AGENT_INSTRUCTIONS.md
2. Read [relevant document from list]
3. Reference pattern from [specific document]

TASK: [What you want built]

REQUIREMENTS:
- [Specific requirement 1]
- [Specific requirement 2]
- [Reference to pattern document for this type of code]

EXAMPLE/REFERENCE:
- See [section name] in [document name]
- Use template from [document name]
```

---

## 🎯 Pro Tips for Getting Better Results

1. **Always mention specific document sections:**
   ```
   Follow "API Call Pattern" from CODE_LOGIC_PATTERNS.md
   ```

2. **Copy relevant templates:**
   ```
   Use this template: [paste template from docs]
   ```

3. **Reference similar code in project:**
   ```
   Follow pattern similar to Button.js in components/buttons/
   ```

4. **Be specific about style approach:**
   ```
   Use conditional spread pattern from CODE_STYLE_IDIOMS.md
   ```

5. **Always mention error handling:**
   ```
   Include try/catch with AsyncStorage fallback from UTILITY_PATTERNS.md
   ```

---

## ❌ What NOT to Ask For

Don't ask agents to:
- Use useState/useEffect (class components only)
- Create separate component variants (use props)
- Use Redux or Context (global + AsyncStorage)
- Hardcode colors, fonts, or text
- Skip PropTypes on components
- Inline styles (use StyleSheet.create)
- Skip error handling on API calls

Instead, ask them to follow the patterns in the documents.

---

## 📞 Example Real Prompts

### Component Example
```
Create a LoginForm component that validates email and password.

FOLLOW THESE PATTERNS EXACTLY:
- AGENT_INSTRUCTIONS.md - Component Rules section
- CODE_LOGIC_PATTERNS.md - Variable naming
- CODE_STYLE_IDIOMS.md - Conditional styling

REQUIREMENTS:
- Use semantic names: showPassword boolean
- All colors from APP_CONFIG
- Validate using ValidateInputs.validateEmail()
- Add PropTypes
- Use StyleSheet.create() with conditional styling

REFERENCE:
- Component template in PATTERNS_AND_CONVENTIONS.md
- Input component example in CODE_STYLE_IDIOMS.md
```

### Utility Example
```
Create a helper function to format phone numbers.

FOLLOW PATTERNS:
- UTILITY_PATTERNS.md - Reference implementations
- CODE_LOGIC_PATTERNS.md - Error handling

REQUIREMENTS:
- Handle null/undefined gracefully
- Validate format first
- Include JSDoc @param and @return
- Wrap in try/catch
- Export from js_utilities/Helpers.js

REFERENCE:
- See formatMoney() in UTILITY_PATTERNS.md as model
```

### Screen Example
```
Create Account_Settings screen.

FOLLOW PATTERNS:
- PATTERNS_AND_CONVENTIONS.md - Screen template
- AGENT_INSTRUCTIONS.md - Navigation & Screen Rules
- CODE_LOGIC_PATTERNS.md - Data loading pattern

REQUIREMENTS:
- Wrap in <Wrapper title={strings.accountSettings}>
- Load user data in componentDidMount
- Handle loading and error states
- All text from strings.js
- Check global.isConnected before API calls
- Use immutable state updates

REFERENCE:
- Screen template in PATTERNS_AND_CONVENTIONS.md
- Data loading pattern in CODE_LOGIC_PATTERNS.md
```
