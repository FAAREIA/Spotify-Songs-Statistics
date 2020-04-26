import React from 'react';

const ButtonClose = props => {
	const {children, classes, handleOnClick} = props;

	return (
		<button
		className={classes || 'close'}
		onClick={handleOnClick}
		type="button">
			{children || 'x'}
		</button>
	);
}

export default ButtonClose;