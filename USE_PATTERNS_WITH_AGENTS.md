# How to Use Pattern Documents with AI Agents

Guide for using your created pattern documents with Copilot Chat and other AI agents.

---

## 🤖 Option 1: VS Code Copilot Chat (Recommended)

### Method A: Include Files in Chat Context

1. **Open Copilot Chat** (Ctrl+Shift+I / Cmd+Shift+I)
2. **Include pattern documents:**
   - Click the **`+`** button in Copilot Chat input
   - Select **"Add Files"**
   - Add: `AGENT_INSTRUCTIONS.md`, `CODE_LOGIC_PATTERNS.md`, etc.

3. **Ask your question:**
   ```
   I need to create a [Component/Screen/Utility].
   Please follow the patterns in the added files.
   ```

4. **Copilot will reference your pattern documents automatically**

### Method B: Copy-Paste Reference in Chat

```
Read AGENT_INSTRUCTIONS.md and CODE_LOGIC_PATTERNS.md 
(both at repo root).

I need to create a [description].

Specific pattern to follow: [reference specific section]
```

### Method C: Ask Copilot to Read Files Directly

```
@workspace 

Please read AGENT_INSTRUCTIONS.md and create [what you want].
Follow all the rules exactly as specified in the file.
```

---

## 🤖 Option 2: Terminal/Command Line Agents

### For Claude, ChatGPT, or Other Agents

1. **Copy the relevant pattern document content**
2. **Include it in your prompt:**

```markdown
# Context - Follow these patterns:

[Paste relevant sections from pattern documents]

# Task
[What you want built]

# Requirements
[Specific requirements]
```

### Example Prompt Structure

```markdown
# HotSpotMobile Development Context

## Patterns to Follow
[Paste AGENT_INSTRUCTIONS.md section]

## Variable Naming Reference
[Paste from CODE_LOGIC_PATTERNS.md - Variable Naming section]

## Task
Create a new Button component that [description]

## Specific Requirements
- Must follow component template from patterns
- Must use semantic naming
- Must include PropTypes
```

---

## 💬 Option 3: Copilot Inline Chat

**For quick edits in files:**

1. Select code in editor
2. Right-click → **"Copilot" → "Ask Copilot"**
3. Write prompt:
   ```
   Following HotSpotMobile patterns (see AGENT_INSTRUCTIONS.md),
   refactor this to use semantic variable names and immutable updates.
   ```

---

## 🎯 Option 4: System Instructions (VS Code Settings)

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.advanced": {
    "debug.overrideChatSystemPrompt": "[System prompt about patterns]"
  }
}
```

**However**, including files in chat (Option 1) is more direct.

---

## 📋 Workflow: Step-by-Step

### When You Need New Code:

**Step 1: Open Copilot Chat**
```
Ctrl+Shift+I (VS Code)
```

**Step 2: Add Pattern Documents**
- Click `+` button
- Select files:
  - AGENT_INSTRUCTIONS.md
  - CODE_LOGIC_PATTERNS.md (if variables naming uncertain)
  - UTILITY_PATTERNS.md (if writing helpers)

**Step 3: Ask Specific Question**
```
Create a [ComponentName] component that [does what].

The component should:
- [requirement 1]
- [requirement 2]
- Follow the patterns in the added files exactly
```

**Step 4: Review Generated Code**
- Check against checklists in DEVELOPMENT.md
- Verify it matches pattern examples
- Request revisions if needed

**Step 5: Copy Code**
- Copy from Copilot
- Paste into your file
- Make any minor adjustments

---

## ✅ Best Practices

### ✅ DO:
- Include pattern documents in Copilot Chat context
- Reference specific document sections: "See [section] in [doc]"
- Ask agent to follow specific patterns: "Follow pattern from CODE_LOGIC_PATTERNS.md"
- Provide template snippets from docs in your prompt
- Include error cases and edge cases in requirements
- Ask for compliance with checklists

### ❌ DON'T:
- Ask for code without referencing patterns
- Ask for features that violate patterns (hooks, Redux, etc.)
- Ignore generated code that breaks patterns
- Skip the checklist validation step
- Ask for hardcoded colors or text
- Request component variants instead of props-based variations

---

## 🔍 Validation Workflow

After agent generates code:

1. **Open DEVELOPMENT.md checklist**
2. **Verify each item:**
   - [ ] Semantic variable names?
   - [ ] Colors from APP_CONFIG?
   - [ ] Text from strings.js?
   - [ ] PropTypes included?
   - [ ] StyleSheet.create() used?
   - [ ] Error handling with try/catch?
   - [ ] Guard clauses for early returns?
   - [ ] Immutable updates (no direct mutation)?

3. **If violations found:**
   - Ask Copilot: "Fix to follow [pattern] from [document]"
   - Reference specific line and pattern name

---

## 💡 Pro Tips

### Tip 1: Use Multiple Chat Sessions
- **Session 1:** Ask Copilot to explain a pattern
- **Session 2:** Ask Copilot to generate code using that pattern

### Tip 2: Reference Existing Code
```
Create a component similar to Button.js but for [new purpose].
Follow patterns in AGENT_INSTRUCTIONS.md.
```

### Tip 3: Ask for Pattern Explanation First
```
Explain the "Conditional Style Override" pattern from CODE_STYLE_IDIOMS.md
Then create a [Component] using that pattern.
```

### Tip 4: Use Template Copy-Paste
1. Copy component template from PATTERNS_AND_CONVENTIONS.md
2. Paste in Copilot: "Fill in this template to create [component]"
3. Specify what goes in each section

### Tip 5: Ask for Validation
```
Does this follow the patterns in AGENT_INSTRUCTIONS.md?
If not, list violations and fix them.
```

---

## 🚀 Example Complete Workflow

### Scenario: Create a new Card component for displaying payment cards

**Step 1: Open Copilot Chat + Add Files**
```
Files added: AGENT_INSTRUCTIONS.md, CODE_LOGIC_PATTERNS.md
```

**Step 2: Provide Context**
```
I need a PaymentCardItem component that displays:
- Card last 4 digits
- Card brand (visa, mastercard)
- Is default indicator

It should be placed in components/lists/
```

**Step 3: Request with Specific Pattern**
```
Create this component following:
- Component template in PATTERNS_AND_CONVENTIONS.md
- Variable naming from CODE_LOGIC_PATTERNS.md
- Styling pattern from CODE_STYLE_IDIOMS.md

Must include:
- PropTypes and defaultProps
- JSDoc comment
- Semantic variable names (isDefault)
- All colors from APP_CONFIG
- StyleSheet.create() styles
```

**Step 4: Request also includes:**
```
When I approve, include:
- Proper export statement
- Error handling if any
- Comments explaining complex logic
```

**Step 5: Review & Validate**
```
After agent provides code, you check:
- Matches component template ✓
- Uses semantic names ✓
- AppConfig colors ✓
- PropTypes ✓
- JSDoc ✓
- StyleSheet ✓
```

**Step 6: Use or Iterate**
```
If violations exist:
"Line X violates [pattern]. 
Please fix using [specific pattern from document]."
```

---

## 🎓 Learning Path

If new to the patterns:

1. **Read DEVELOPMENT.md** (5 min) - Quick overview
2. **Read AGENT_INSTRUCTIONS.md** (15 min) - Core rules
3. **Skim CODE_LOGIC_PATTERNS.md** (10 min) - Variable naming
4. **Reference specific docs** as needed when creating code

Then you can effectively guide agents.

---

## 🆘 Troubleshooting

### Problem: Agent ignored patterns
**Solution:** Include pattern files directly in Copilot Chat, reference specific section

### Problem: Generated code violates patterns
**Solution:** Ask agent to "Fix [specific code] to follow [pattern] from [document]"

### Problem: Agent doesn't know correct variable names
**Solution:** Paste variable naming section from CODE_LOGIC_PATTERNS.md in prompt

### Problem: Agent created wrong component structure
**Solution:** Provide template from PATTERNS_AND_CONVENTIONS.md, ask to fill it in

### Problem: Styling looks wrong
**Solution:** Reference "Component Styling Pattern" from CODE_STYLE_IDIOMS.md

---

## 📞 Quick Reference: Which Document for What?

| Question | Document | Section |
|----------|----------|---------|
| How should variable X be named? | CODE_LOGIC_PATTERNS.md | Variable Naming |
| How do I write an API call? | CODE_LOGIC_PATTERNS.md | API Call Patterns |
| How should styles be organized? | CODE_STYLE_IDIOMS.md | Component Styling |
| How do I handle async/await? | CODE_LOGIC_PATTERNS.md | Async/Await Mastery |
| Where do I place this file? | PATTERNS_AND_CONVENTIONS.md | File Structure |
| What props should component have? | AGENT_INSTRUCTIONS.md | Component Rules |
| How do I write a helper function? | UTILITY_PATTERNS.md | Full section |
| What about error handling? | CODE_LOGIC_PATTERNS.md | Error Handling |
| How do I use state? | CODE_LOGIC_PATTERNS.md | State Management |
| Quick checklist? | DEVELOPMENT.md | Checklist section |

---

## 🎯 TL;DR - Quick Start

1. Open Copilot Chat (Ctrl+Shift+I)
2. Click `+` → Add `AGENT_INSTRUCTIONS.md`
3. Type: `Create [what you want], following patterns in added file`
4. Review code against DEVELOPMENT.md checklist
5. Done ✓

Or copy patterns into any agent prompt and reference them.
