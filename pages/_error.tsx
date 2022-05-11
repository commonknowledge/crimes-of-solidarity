function Error({ res, err, statusCode }) {
  return (
    <p>
      <span>
        help me somebody {res} {err} {statusCode}
      </span>
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : "An error occurred on client"}
    </p>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { res, err, statusCode };
};

export default Error;
