import { Region } from '@linode/api-v4/lib/regions';
import AU from 'flag-icon-css/flags/4x3/au.svg';
import CA from 'flag-icon-css/flags/4x3/ca.svg';
import DE from 'flag-icon-css/flags/4x3/de.svg';
import UK from 'flag-icon-css/flags/4x3/gb.svg';
import IN from 'flag-icon-css/flags/4x3/in.svg';
import JP from 'flag-icon-css/flags/4x3/jp.svg';
import SG from 'flag-icon-css/flags/4x3/sg.svg';
import US from 'flag-icon-css/flags/4x3/us.svg';
import { groupBy } from 'ramda';
import * as React from 'react';
import { makeStyles, Theme } from 'src/components/core/styles';
import SingleValue from 'src/components/EnhancedSelect/components/SingleValue';
import Select, {
  BaseSelectProps,
  GroupType,
} from 'src/components/EnhancedSelect/Select';
import RegionOption, { RegionItem } from './RegionOption';

export interface ExtendedRegion extends Region {
  display: string;
  disabled?: boolean;
}

interface Props extends Omit<BaseSelectProps, 'onChange'> {
  regions: ExtendedRegion[];
  handleSelection: (id: string) => void;
  selectedID: string | null;
  label?: string;
  helperText?: string;
  isClearable?: boolean;
  required?: boolean;
}

export const flags = {
  au: () => <AU width="32" height="24" viewBox="0 0 640 480" />,
  us: () => <US width="32" height="24" viewBox="0 0 640 480" />,
  sg: () => <SG id="singapore" width="32" height="24" viewBox="0 0 640 480" />,
  jp: () => (
    <JP
      id="japan"
      width="32"
      height="24"
      viewBox="0 0 640 480"
      style={{ backgroundColor: '#fff' }}
    />
  ),
  uk: () => <UK width="32" height="24" viewBox="0 0 640 480" />,
  eu: () => <UK width="32" height="24" viewBox="0 0 640 480" />,
  de: () => <DE width="32" height="24" viewBox="0 0 640 480" />,
  ca: () => <CA width="32" height="24" viewBox="0 0 640 480" />,
  in: () => <IN width="32" height="24" viewBox="0 0 640 480" />,
};

export const selectStyles = {
  menuList: (base: any) => ({ ...base, maxHeight: `40vh !important` }),
};
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& svg': {
      '& g': {
        // Super hacky fix for Firefox rendering of some flag icons that had a clip-path property.
        clipPath: 'none !important' as 'none',
      },
    },
    '& #singapore, #japan': {
      border: `1px solid ${theme.color.border3}`,
    },
  },
}));

export const getRegionOptions = (regions: ExtendedRegion[]) => {
  const groupedRegions = groupBy<ExtendedRegion>((thisRegion) => {
    if (thisRegion.country.match(/(us|ca)/)) {
      return 'North America';
    }
    if (thisRegion.country.match(/(de|uk|eu)/)) {
      return 'Europe';
    }
    if (thisRegion.country.match(/(jp|sg|in|au)/)) {
      return 'Asia Pacific';
    }
    return 'Other';
  }, regions);
  return ['North America', 'Europe', 'Asia Pacific', 'Other'].reduce(
    (accum, thisGroup) => {
      if (
        !groupedRegions[thisGroup] ||
        groupedRegions[thisGroup].length === 0
      ) {
        return accum;
      }
      return [
        ...accum,
        {
          label: thisGroup,
          options: groupedRegions[thisGroup]
            .map((thisRegion) => ({
              label: thisRegion.display,
              value: thisRegion.id,
              flag:
                flags[thisRegion.country.toLocaleLowerCase()] ?? (() => null),
              country: thisRegion.country,
            }))

            .sort(sortRegions),
        },
      ];
    },
    []
  );
};

export const getSelectedRegionById = (
  regionID: string,
  options: GroupType[]
) => {
  const regions = options.reduce(
    (accum, thisGroup) => [...accum, ...thisGroup.options],
    []
  );
  return regions.find((thisRegion) => regionID === thisRegion.value);
};

const sortRegions = (region1: RegionItem, region2: RegionItem) => {
  // By country desc so USA is on top
  if (region1.country > region2.country) {
    return -1;
  }
  if (region1.country < region2.country) {
    return 1;
  }
  // Alphabetically by display name, which is the city
  if (region1.label < region2.label) {
    return -1;
  }
  if (region1.label > region2.label) {
    return 1;
  }
  return 0;
};

const SelectRegionPanel: React.FC<Props> = (props) => {
  const {
    label,
    disabled,
    handleSelection,
    isClearable,
    helperText,
    regions,
    selectedID,
    styles,
    required,
    ...restOfReactSelectProps
  } = props;

  const onChange = React.useCallback(
    (selection: RegionItem | null) => {
      if (selection === null) {
        handleSelection('');
        return;
      }
      if (selection.disabledMessage) {
        // React Select's disabled state should prevent anything
        // from firing, this is basic paranoia.
        return;
      }
      handleSelection(selection?.value);
    },
    [handleSelection]
  );

  const classes = useStyles();

  const options = React.useMemo(() => getRegionOptions(regions), [regions]);

  return (
    <div className={classes.root}>
      <Select
        isClearable={Boolean(isClearable)} // Defaults to false if the prop isn't provided
        value={getSelectedRegionById(selectedID || '', options)}
        label={label ?? 'Region'}
        disabled={disabled}
        placeholder="Select a Region"
        options={options}
        onChange={onChange}
        components={{ Option: RegionOption, SingleValue }}
        isOptionDisabled={(option: RegionItem) =>
          Boolean(option.disabledMessage)
        }
        styles={styles || selectStyles}
        textFieldProps={{
          tooltipText: helperText,
        }}
        required={required}
        {...restOfReactSelectProps}
      />
    </div>
  );
};

export default React.memo(SelectRegionPanel);
