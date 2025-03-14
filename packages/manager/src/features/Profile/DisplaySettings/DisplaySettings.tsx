import { updateUser } from '@linode/api-v4/lib/account';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { compose } from 'recompose';
import Paper from 'src/components/core/Paper';
import { makeStyles, Theme } from 'src/components/core/styles';
import { SingleTextFieldForm } from 'src/components/SingleTextFieldForm/SingleTextFieldForm';
import { useMutateProfile, useProfile } from 'src/queries/profile';
import { ApplicationState } from 'src/store';
import withNotifications, {
  WithNotifications,
} from 'src/store/notification/notification.containers';
import getUserTimezone from 'src/utilities/getUserTimezone';
import { v4 } from 'uuid';
import TimezoneForm from './TimezoneForm';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    marginBottom: theme.spacing(3),
  },
}));

export const DisplaySettings: React.FC<WithNotifications> = (props) => {
  const classes = useStyles();

  const { mutateAsync: updateProfile } = useMutateProfile();
  const { data: profile, refetch: requestProfile } = useProfile();

  const timezone = getUserTimezone();
  const loggedInAsCustomer = useSelector(
    (state: ApplicationState) => state.authentication.loggedInAsCustomer
  );
  const location = useLocation();

  const emailRef = React.createRef<HTMLInputElement>();

  React.useEffect(() => {
    if (location.state?.focusEmail && emailRef.current) {
      emailRef.current.focus();
      emailRef.current.scrollIntoView();
    }
  }, [emailRef, location.state]);

  // Used as React keys to force-rerender forms.
  const [emailResetToken, setEmailResetToken] = React.useState(v4());
  const [usernameResetToken, setUsernameResetToken] = React.useState(v4());
  const [timezoneResetToken, setTimezoneResetToken] = React.useState(v4());

  const updateUsername = (newUsername: string) => {
    setEmailResetToken(v4());
    setTimezoneResetToken(v4());
    // Default to empty string... but I don't believe this is possible.
    return updateUser(profile?.username ?? '', {
      username: newUsername,
    });
  };

  const updateEmail = (newEmail: string) => {
    setUsernameResetToken(v4());
    setTimezoneResetToken(v4());
    return updateProfile({ email: newEmail });
  };

  const updateTimezone = (newTimezone: string) => {
    setUsernameResetToken(v4());
    setEmailResetToken(v4());
    return updateProfile({ timezone: newTimezone });
  };

  return (
    <>
      <Paper className={classes.paper}>
        <SingleTextFieldForm
          key={usernameResetToken}
          label="Username"
          submitForm={updateUsername}
          initialValue={profile?.username}
          disabled={profile?.restricted}
          tooltipText={
            profile?.restricted
              ? 'Restricted users cannot update their username. Please contact an account administrator.'
              : undefined
          }
          successCallback={requestProfile}
        />
      </Paper>

      <Paper className={classes.paper}>
        <SingleTextFieldForm
          key={emailResetToken}
          label="Email"
          submitForm={updateEmail}
          initialValue={profile?.email}
          successCallback={() => {
            // If there's a "user_email_bounce" notification for this user, and
            // the user has just updated their email, re-request notifications to
            // potentially clear the email bounce notification.
            const hasUserEmailBounceNotification = props.notifications.find(
              (thisNotification) =>
                thisNotification.type === 'user_email_bounce'
            );
            if (hasUserEmailBounceNotification) {
              props.requestNotifications();
            }
          }}
          inputRef={emailRef}
          type="email"
        />
      </Paper>
      <Paper className={classes.paper}>
        <TimezoneForm
          key={timezoneResetToken}
          timezone={timezone}
          loggedInAsCustomer={loggedInAsCustomer}
          updateTimezone={updateTimezone}
        />
      </Paper>
    </>
  );
};

const enhanced = compose<WithNotifications, {}>(withNotifications());

export default enhanced(DisplaySettings);
