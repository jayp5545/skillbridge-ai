import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

const RadioButton = ({ selected, onPress, outerColor, innerColor, size }) => {
    return (
        <TouchableOpacity style={radioButtonStyles.radioButtonOuterCircle} onPress={onPress}>
            <View style={[
                radioButtonStyles.radioButtonInnerCircle,
                selected ? { backgroundColor: innerColor, width: size / 2, height: size / 2, borderRadius: size / 4 } : null,
                { borderColor: outerColor, width: size, height: size, borderRadius: size / 2 }
            ]} />
        </TouchableOpacity>
    );
};

const radioButtonStyles = StyleSheet.create({
    radioButtonOuterCircle: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioButtonInnerCircle: {
        borderWidth: 2,
    }
});

export default RadioButton;