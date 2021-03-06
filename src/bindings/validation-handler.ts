import {BindingHelper} from "../helpers/binding-helper";
import {viewStrategyRegistry, ElementHelper, ValidationState} from "@treacherous/view";
import {PropertyStateChangedEvent} from "@treacherous/core";

export class ValidationHandler
{
    public static handleValidation(element, propertyPath, propertyObservable, bindingContext) {
        var validationGroup = BindingHelper.getValidationGroup(bindingContext);
        var viewOptions = BindingHelper.getViewOptions(bindingContext);
        var validationState = ValidationState.unknown;
        bindingContext[BindingHelper.validationPropertyPathBindingName] = propertyPath;

        var strategy = ElementHelper.getViewStrategyFrom(element) || BindingHelper.getViewStrategy(bindingContext);
        var propertyPathOverride = ElementHelper.getPropertyRouteFrom(element);

        if(!validationGroup || strategy == "none")
        { return; }

        if(propertyPathOverride)
        { propertyPath = propertyPathOverride; }

        var viewStrategy = viewStrategyRegistry.getStrategyNamed(strategy);


        var handlePossibleError = (error) => {
            if(!error)
            {
                viewStrategy.propertyBecomeValid(element, propertyPath, validationState, viewOptions);
                validationState = ValidationState.valid;
            }
            else
            {
                viewStrategy.propertyBecomeInvalid(element, error, propertyPath, validationState, viewOptions);
                validationState = ValidationState.invalid;
            }
        };

        var getPropertyError = () => {
            validationGroup.getPropertyError(propertyPath, true);
        };

        var handlePropertyStateChange = (args: PropertyStateChangedEvent) => {
            handlePossibleError(args.error);
        };

        var propertyStateChangePredicate = (args: PropertyStateChangedEvent) => {
            return args.property == propertyPath;
        };

        validationGroup.propertyStateChangedEvent.subscribe(handlePropertyStateChange, propertyStateChangePredicate);

        // TODO: need to clean up afterwards on subs
        if(propertyObservable) {
            propertyObservable.subscribe(getPropertyError);
        }

        if(viewOptions.immediateErrors)
        { getPropertyError(); }
    };
}