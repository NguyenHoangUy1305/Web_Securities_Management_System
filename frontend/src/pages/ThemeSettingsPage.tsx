import { type FC } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/* ------------------------------------------------------------------ */
/*  Color Picker Field                                                 */
/* ------------------------------------------------------------------ */

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField: FC<ColorFieldProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-gray-400">{value}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-600 bg-transparent p-0.5"
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Section Wrapper                                                    */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: FC<SectionProps> = ({ title, children }) => (
  <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-5">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle: FC<ToggleProps> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
        ${checked ? 'bg-blue-600' : 'bg-gray-700'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
          transform ring-0 transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Radio Group                                                        */
/* ------------------------------------------------------------------ */

interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  label: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

function RadioGroup<T extends string>({ label, options, value, onChange }: RadioGroupProps<T>) {
  return (
    <div>
      <span className="block text-sm font-medium text-gray-300 mb-3">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150
              ${
                value === opt.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-200'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ThemeSettingsPage                                                  */
/* ------------------------------------------------------------------ */

const ThemeSettingsPage: FC = () => {
  const {
    primaryColor,
    bgColor,
    cardBgColor,
    textColor,
    accentColor,
    sidebarWidth,
    fontSize,
    roundedCorners,
    animations,
    updateTheme,
    resetTheme,
  } = useTheme();

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8 px-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Theme Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Customize the appearance of the application to your preference.
        </p>
      </div>

      {/* -------- Color Scheme -------- */}
      <Section title="Color Scheme">
        <ColorField
          label="Primary Color"
          value={primaryColor}
          onChange={(v) => updateTheme({ primaryColor: v })}
        />
        <div className="border-t border-gray-800" />
        <ColorField
          label="Background Color"
          value={bgColor}
          onChange={(v) => updateTheme({ bgColor: v })}
        />
        <div className="border-t border-gray-800" />
        <ColorField
          label="Card Background"
          value={cardBgColor}
          onChange={(v) => updateTheme({ cardBgColor: v })}
        />
        <div className="border-t border-gray-800" />
        <ColorField
          label="Text Color"
          value={textColor}
          onChange={(v) => updateTheme({ textColor: v })}
        />
        <div className="border-t border-gray-800" />
        <ColorField
          label="Accent Color"
          value={accentColor}
          onChange={(v) => updateTheme({ accentColor: v })}
        />
      </Section>

      {/* -------- Layout -------- */}
      <Section title="Layout">
        <RadioGroup
          label="Sidebar Width"
          options={[
            { value: 'narrow', label: 'Narrow' },
            { value: 'medium', label: 'Medium' },
            { value: 'wide', label: 'Wide' },
          ]}
          value={sidebarWidth}
          onChange={(v) => updateTheme({ sidebarWidth: v })}
        />

        <div className="border-t border-gray-800" />

        <RadioGroup
          label="Font Size"
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          value={fontSize}
          onChange={(v) => updateTheme({ fontSize: v })}
        />

        <div className="border-t border-gray-800" />

        <Toggle
          label="Rounded Corners"
          checked={roundedCorners}
          onChange={(v) => updateTheme({ roundedCorners: v })}
        />

        <div className="border-t border-gray-800" />

        <Toggle
          label="Animations"
          checked={animations}
          onChange={(v) => updateTheme({ animations: v })}
        />
      </Section>

      {/* -------- Reset -------- */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={resetTheme}
          className="
            px-6 py-2.5 rounded-lg text-sm font-medium
            bg-red-600/10 text-red-400 border border-red-800/40
            hover:bg-red-600/20 hover:border-red-600/60
            transition-colors duration-150
          "
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default ThemeSettingsPage;
