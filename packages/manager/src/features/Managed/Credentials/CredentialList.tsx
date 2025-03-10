import {
  createCredential,
  CredentialPayload,
  deleteCredential,
  ManagedCredential,
  updateCredential,
  updatePassword,
} from '@linode/api-v4/lib/managed';
import { APIError } from '@linode/api-v4/lib/types';
import { FormikBag } from 'formik';
import { withSnackbar, WithSnackbarProps } from 'notistack';
import * as React from 'react';
import AddNewLink from 'src/components/AddNewLink';
import { makeStyles, Theme } from 'src/components/core/styles';
import TableBody from 'src/components/core/TableBody';
import TableHead from 'src/components/core/TableHead';
import Typography from 'src/components/core/Typography';
import DeletionDialog from 'src/components/DeletionDialog';
import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import Grid from 'src/components/Grid';
import OrderBy from 'src/components/OrderBy';
import Paginate from 'src/components/Paginate';
import PaginationFooter from 'src/components/PaginationFooter';
import Table from 'src/components/Table';
import TableCell from 'src/components/TableCell';
import TableRow from 'src/components/TableRow';
import TableSortCell from 'src/components/TableSortCell';
import { useDialog } from 'src/hooks/useDialog';
import { getAPIErrorOrDefault } from 'src/utilities/errorUtils';
import {
  handleFieldErrors,
  handleGeneralErrors,
} from 'src/utilities/formikErrorUtils';
import AddCredentialDrawer from './AddCredentialDrawer';
import CredentialTableContent from './CredentialTableContent';
import UpdateCredentialDrawer from './UpdateCredentialDrawer';

const useStyles = makeStyles((theme: Theme) => ({
  copy: {
    fontSize: '0.875rem',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing(),
      marginRight: theme.spacing(),
    },
  },
  header: {
    margin: 0,
    width: '100%',
  },
  addNewWrapper: {
    '&.MuiGrid-item': {
      paddingTop: 0,
      paddingRight: 0,
    },
    [theme.breakpoints.down('sm')]: {
      marginRight: theme.spacing(),
    },
  },
  actionCell: {
    '&.emptyCell': {
      fontSize: '0.875em !important',
    },
  },
}));

interface Props {
  error?: APIError[];
  credentials: ManagedCredential[];
  loading: boolean;
  update: () => void;
}

type CombinedProps = Props & WithSnackbarProps;

export type FormikProps = FormikBag<Props, CredentialPayload>;

export const CredentialList: React.FC<CombinedProps> = (props) => {
  const classes = useStyles();
  const { credentials, enqueueSnackbar, error, loading, update } = props;
  // Creation drawer
  const [isCreateDrawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  // Edit drawer (separate because the API requires two different endpoints for editing credentials)
  const [isEditDrawerOpen, setEditDrawerOpen] = React.useState<boolean>(false);
  const [editID, setEditID] = React.useState<number>(0);

  const {
    dialog,
    openDialog,
    closeDialog,
    submitDialog,
    handleError,
  } = useDialog<number>(deleteCredential);

  const selectedCredential = credentials.find(
    (thisCredential) => thisCredential.id === editID
  );

  const handleDelete = () => {
    submitDialog(dialog.entityID)
      .then(() => {
        enqueueSnackbar('Credential deleted successfully.', {
          variant: 'success',
        });
        update();
      })
      .catch((e) =>
        handleError(
          getAPIErrorOrDefault(e, 'Error deleting this credential.')[0].reason
        )
      );
  };

  const _handleError = (
    e: APIError[],
    setSubmitting: any,
    setErrors: any,
    setStatus: any,
    defaultMessage: string
  ) => {
    const mapErrorToStatus = (generalError: string) =>
      setStatus({ generalError });

    handleFieldErrors(setErrors, e);
    handleGeneralErrors(mapErrorToStatus, e, defaultMessage);
    setSubmitting(false);
  };

  const handleCreate = (
    values: CredentialPayload,
    { setSubmitting, setErrors, setStatus }: FormikProps
  ) => {
    setStatus(undefined);
    createCredential(values)
      .then(() => {
        setDrawerOpen(false);
        setSubmitting(false);
        update();
      })
      .catch((e) => {
        _handleError(
          e,
          setSubmitting,
          setErrors,
          setStatus,
          `Unable to create this Credential. Please try again later.`
        );
      });
  };

  const handleUpdatePassword = (
    values: CredentialPayload,
    { setSubmitting, setErrors, setStatus, setFieldValue }: FormikProps
  ) => {
    setStatus(undefined);
    if (!selectedCredential) {
      return;
    }
    updatePassword(editID, {
      password: values.password || undefined,
      username: values.username || undefined,
    })
      .then(() => {
        setSubmitting(false);
        setStatus({ success: 'Updated successfully.' });
        setFieldValue('password', '');
        setFieldValue('username', '');
        update();
      })
      .catch((err) =>
        _handleError(
          err,
          setSubmitting,
          setErrors,
          setStatus,
          'Unable to update this Credential.'
        )
      );
  };

  const handleUpdateLabel = (
    values: CredentialPayload,
    { setSubmitting, setErrors, setStatus }: FormikProps
  ) => {
    setStatus(undefined);
    if (!selectedCredential) {
      return;
    }
    updateCredential(editID, { label: values.label })
      .then(() => {
        setSubmitting(false);
        setStatus({ success: 'Label updated successfully.' });
        update();
      })
      .catch((err) =>
        _handleError(
          err,
          setSubmitting,
          setErrors,
          setStatus,
          'Unable to update this Credential.'
        )
      );
  };

  const openForEdit = (credentialID: number) => {
    setEditID(credentialID);
    setEditDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setEditID(0);
    setEditDrawerOpen(false);
  };

  return (
    <>
      <DocumentTitleSegment segment="Credentials" />
      <Typography className={classes.copy}>
        Please share any credentials our support team may need when responding
        to a service issue.
        <br /> Credentials are stored encrypted and all decryption attempts are
        logged. You can revoke credentials at any time by deleting them.
      </Typography>
      <Grid
        className={classes.header}
        container
        alignItems="center"
        justify="flex-end"
        updateFor={[credentials, error, loading]}
      >
        <Grid className={classes.addNewWrapper} item>
          <AddNewLink
            label="Add Credential"
            onClick={() => setDrawerOpen(true)}
          />
        </Grid>
      </Grid>
      <OrderBy data={credentials} orderBy={'label'} order={'asc'}>
        {({ data: orderedData, handleOrderChange, order, orderBy }) => (
          <Paginate data={orderedData}>
            {({
              data,
              count,
              handlePageChange,
              handlePageSizeChange,
              page,
              pageSize,
            }) => (
              <>
                <Table aria-label="List of Your Managed Credentials">
                  <TableHead>
                    <TableRow>
                      <TableSortCell
                        active={orderBy === 'label'}
                        label={'label'}
                        direction={order}
                        handleClick={handleOrderChange}
                        data-qa-credential-label-header
                        style={{ width: '30%' }}
                      >
                        Credential
                      </TableSortCell>
                      <TableSortCell
                        active={orderBy === 'last_decrypted'}
                        label={'last_decrypted'}
                        direction={order}
                        handleClick={handleOrderChange}
                        data-qa-credential-decrypted-header
                        style={{ width: '60%' }}
                      >
                        Last Decrypted
                      </TableSortCell>
                      <TableCell className={classes.actionCell} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <CredentialTableContent
                      credentials={data}
                      loading={loading}
                      error={error}
                      openDialog={openDialog}
                      openForEdit={openForEdit}
                    />
                  </TableBody>
                </Table>
                <PaginationFooter
                  count={count}
                  handlePageChange={handlePageChange}
                  handleSizeChange={handlePageSizeChange}
                  page={page}
                  pageSize={pageSize}
                  eventCategory="managed credential table"
                />
              </>
            )}
          </Paginate>
        )}
      </OrderBy>
      <DeletionDialog
        open={dialog.isOpen}
        entity="credential"
        label={dialog.entityLabel || ''}
        loading={dialog.isLoading}
        error={dialog.error}
        onClose={closeDialog}
        onDelete={handleDelete}
      />
      <AddCredentialDrawer
        open={isCreateDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
      />
      <UpdateCredentialDrawer
        open={isEditDrawerOpen}
        label={selectedCredential ? selectedCredential.label : ''}
        onClose={handleDrawerClose}
        onSubmitLabel={handleUpdateLabel}
        onSubmitPassword={handleUpdatePassword}
      />
    </>
  );
};

export default withSnackbar(CredentialList);
