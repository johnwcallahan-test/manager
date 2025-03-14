import { Linode } from '@linode/api-v4/lib/linodes/types';
import { Region } from '@linode/api-v4/lib/regions/types';
import { APIError } from '@linode/api-v4/lib/types';
import { CreateVolumeSchema } from '@linode/validation/lib/volumes.schema';
import { Formik } from 'formik';
import * as React from 'react';
import { connect, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { compose } from 'recompose';
import Button from 'src/components/Button';
import Box from 'src/components/core/Box';
import Form from 'src/components/core/Form';
import FormHelperText from 'src/components/core/FormHelperText';
import Paper from 'src/components/core/Paper';
import { makeStyles, Theme } from 'src/components/core/styles';
import Typography from 'src/components/core/Typography';
import RegionSelect from 'src/components/EnhancedSelect/variants/RegionSelect';
import Grid from 'src/components/Grid';
import Notice from 'src/components/Notice';
import TagsInput, { Tag as _Tag } from 'src/components/TagsInput';
import { dcDisplayNames, MAX_VOLUME_SIZE } from 'src/constants';
import withVolumesRequests, {
  VolumesRequests,
} from 'src/containers/volumesRequests.container';
import { hasGrant } from 'src/features/Profile/permissionsHelpers';
import { ApplicationState } from 'src/store';
import { MapState } from 'src/store/types';
import { Origin as VolumeDrawerOrigin } from 'src/store/volumeForm';
import { getErrorStringOrDefault } from 'src/utilities/errorUtils';
import {
  handleFieldErrors,
  handleGeneralErrors,
} from 'src/utilities/formikErrorUtils';
import { sendCreateVolumeEvent } from 'src/utilities/ga';
import isNilOrEmpty from 'src/utilities/isNilOrEmpty';
import maybeCastToNumber from 'src/utilities/maybeCastToNumber';
import { array, object, string } from 'yup';
import ConfigSelect, {
  initialValueDefaultId,
} from '../VolumeDrawer/ConfigSelect';
import LabelField from '../VolumeDrawer/LabelField';
import NoticePanel from '../VolumeDrawer/NoticePanel';
import SizeField from '../VolumeDrawer/SizeField';
import { useGrants, useProfile } from 'src/queries/profile';
import useFlags from 'src/hooks/useFlags';
import LinodeSelect from 'src/features/linodes/LinodeSelect';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    maxWidth: 960,
  },
  copy: {
    marginTop: theme.spacing(),
    marginBottom: theme.spacing(3),
  },
  notice: {
    borderColor: theme.color.green,
  },
  button: {
    marginTop: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      marginRight: theme.spacing(),
    },
  },
}));

interface Props {
  regions: Region[];
  history: RouteComponentProps['history'];
  onSuccess: (
    volumeLabel: string,
    volumePath: string,
    message?: string
  ) => void;
}

// The original schema expects tags to be an array of strings, but Formik treats
// tags as _Tag[], so we extend the schema to transform tags before validation.
const extendedCreateVolumeSchema = CreateVolumeSchema.concat(
  object({
    tags: array()
      .transform((tagItems: _Tag[]) =>
        tagItems.map((thisTagItem) => thisTagItem.value)
      )
      .of(string()),
  })
);

type CombinedProps = Props & VolumesRequests & StateProps;

const CreateVolumeForm: React.FC<CombinedProps> = (props) => {
  const classes = useStyles();
  const flags = useFlags();
  const { onSuccess, createVolume, origin, history, regions } = props;

  const { data: profile } = useProfile();
  const { data: grants } = useGrants();

  const disabled = profile?.restricted && !hasGrant('add_volumes', grants);

  const [linodeId, setLinodeId] = React.useState<number>(initialValueDefaultId);

  // This is to keep track of this linodeId's errors so we can select it from the Redux store for the error message.
  const { error: configsError } = useSelector((state: ApplicationState) => {
    return state.__resources.linodeConfigs[linodeId] ?? { error: {} };
  });

  const configErrorMessage = configsError?.read
    ? 'Unable to load configs for this Linode.' // More specific than the API error message
    : undefined;

  const regionsWithBlockStorage = regions
    .filter((thisRegion) => thisRegion.capabilities.includes('Block Storage'))
    .map((thisRegion) => thisRegion.id);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={extendedCreateVolumeSchema}
      onSubmit={(
        values,
        { resetForm, setSubmitting, setStatus, setErrors }
      ) => {
        const { label, size, region, linode_id, config_id, tags } = values;

        setSubmitting(true);

        /** Status holds our success and generalError messages. */
        setStatus(undefined);

        createVolume({
          label,
          size: maybeCastToNumber(size),
          region:
            isNilOrEmpty(region) || region === 'none' ? undefined : region,
          linode_id:
            linode_id === initialValueDefaultId
              ? undefined
              : maybeCastToNumber(linode_id),
          config_id:
            config_id === initialValueDefaultId
              ? undefined
              : maybeCastToNumber(config_id),
          tags: tags.map((v) => v.value),
        })
          .then(({ filesystem_path, label: volumeLabel }) => {
            resetForm({ values: initialValues });
            setStatus({ success: `Volume scheduled for creation.` });
            setSubmitting(false);
            onSuccess(
              volumeLabel,
              filesystem_path,
              `Volume scheduled for creation.`
            );
            history.push('/volumes');
            // GA Event
            sendCreateVolumeEvent(`${label}: ${size}GiB`, origin);
          })
          .catch((errorResponse) => {
            const defaultMessage = `Unable to create a volume at this time. Please try again later.`;
            const mapErrorToStatus = (generalError: string) =>
              setStatus({ generalError });

            setSubmitting(false);
            handleFieldErrors(setErrors, errorResponse);
            handleGeneralErrors(
              mapErrorToStatus,
              errorResponse,
              defaultMessage
            );
          });
      }}
    >
      {({
        errors,
        handleBlur,
        handleChange,
        handleSubmit,
        isSubmitting,
        setFieldValue,
        status,
        values,
        touched,
      }) => {
        const { linode_id, config_id } = values;

        const linodeError = touched.linode_id ? errors.linode_id : undefined;

        const generalError = status
          ? status.generalError
          : config_id === initialValueDefaultId
          ? errors.config_id
          : undefined;

        return (
          <Form>
            {generalError ? <NoticePanel error={generalError} /> : null}
            {status ? <NoticePanel success={status.success} /> : null}
            {disabled ? (
              <Notice
                text={
                  "You don't have permissions to create a new Volume. Please contact an account administrator for details."
                }
                error={true}
                important
              />
            ) : null}
            <Grid container direction="column">
              <Grid item className={classes.root}>
                <Paper>
                  {flags.blockStorageAvailability ? (
                    <Notice success className={classes.notice}>
                      High-performance NVMe block storage is currently available
                      in Atlanta, Georgia.
                    </Notice>
                  ) : null}
                  <Typography variant="body1" data-qa-volume-size-help>
                    A single Volume can range from 10 to {MAX_VOLUME_SIZE}{' '}
                    gibibytes in size and costs <b>$0.10/GiB per month</b>. Up
                    to eight volumes can be attached to a single Linode.
                  </Typography>
                  <Typography
                    variant="body1"
                    className={classes.copy}
                    data-qa-volume-help
                  >
                    Volumes must be created in a particular region. You can
                    choose to create a Volume in a region and attach it later to
                    a Linode in the same region. If you select a Linode from the
                    field below, the Volume will be automatically created in
                    that Linode&apos;s region and attached upon creation.
                  </Typography>
                  <LabelField
                    name="label"
                    disabled={disabled}
                    error={touched.label ? errors.label : undefined}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.label}
                  />
                  <SizeField
                    name="size"
                    disabled={disabled}
                    error={touched.size ? errors.size : undefined}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.size}
                  />
                  <RegionSelect
                    name="region"
                    disabled={disabled}
                    errorText={touched.region ? errors.region : undefined}
                    handleSelection={(value) => {
                      setFieldValue('region', value);
                      setFieldValue('linode_id', initialValueDefaultId);
                    }}
                    isClearable
                    onBlur={handleBlur}
                    regions={props.regions
                      .filter((eachRegion) =>
                        eachRegion.capabilities.some((eachCape) =>
                          eachCape.match(/block/i)
                        )
                      )
                      .map((eachRegion) => ({
                        ...eachRegion,
                        display: dcDisplayNames[eachRegion.id],
                      }))}
                    selectedID={values.region}
                  />
                  <FormHelperText data-qa-volume-region>
                    The datacenter where the new volume should be created. Only
                    regions supporting block storage are displayed.
                  </FormHelperText>
                  <LinodeSelect
                    name="linodeId"
                    disabled={disabled}
                    filterCondition={(linode: Linode) =>
                      regionsWithBlockStorage.includes(linode.region)
                    }
                    handleChange={(linode: Linode) => {
                      setFieldValue('linode_id', linode.id);
                      setFieldValue('region', linode.region);
                      setLinodeId(linode.id);
                    }}
                    linodeError={linodeError || configErrorMessage}
                    onBlur={handleBlur}
                    selectedLinode={values.linode_id}
                    region={values.region}
                  />
                  <ConfigSelect
                    name="configId"
                    disabled={disabled}
                    error={touched.config_id ? errors.config_id : undefined}
                    linodeId={linode_id}
                    onBlur={handleBlur}
                    onChange={(id: number) => setFieldValue('config_id', id)}
                    value={config_id}
                  />
                  <TagsInput
                    name="tags"
                    disabled={disabled}
                    label="Tags"
                    menuPlacement="top"
                    onChange={(selected) => setFieldValue('tags', selected)}
                    tagError={
                      touched.tags
                        ? errors.tags
                          ? getErrorStringOrDefault(
                              errors.tags as APIError[],
                              'Unable to tag Volume.'
                            )
                          : undefined
                        : undefined
                    }
                    value={values.tags}
                  />
                </Paper>
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  className={classes.button}
                >
                  <Button
                    buttonType="primary"
                    disabled={disabled}
                    loading={isSubmitting}
                    onClick={() => handleSubmit()}
                    data-qa-deploy-linode
                  >
                    Create Volume
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        );
      }}
    </Formik>
  );
};

interface FormState {
  label: string;
  size: number;
  region: string;
  linode_id: number;
  config_id: number;
  tags: _Tag[];
}

const initialValues: FormState = {
  label: '',
  size: 20,
  region: '',
  linode_id: initialValueDefaultId,
  config_id: initialValueDefaultId,
  tags: [],
};

interface StateProps {
  origin?: VolumeDrawerOrigin;
}

const mapStateToProps: MapState<StateProps, CombinedProps> = (state) => ({
  origin: state.volumeDrawer.origin,
});

const connected = connect(mapStateToProps);

const enhanced = compose<CombinedProps, Props>(
  withVolumesRequests,
  connected
)(CreateVolumeForm);

export default enhanced;
