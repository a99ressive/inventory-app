using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace server.Middleware;

public static class ExceptionHandlingExtensions
{
    public static void UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var feature = context.Features.Get<IExceptionHandlerFeature>();
                var exception = feature?.Error;

                var (status, title, detail) = exception switch
                {
                    UnauthorizedAccessException ex => (StatusCodes.Status403Forbidden, "Forbidden", ex.Message),
                    KeyNotFoundException ex => (StatusCodes.Status404NotFound, "Not Found", ex.Message),
                    InvalidOperationException ex => (StatusCodes.Status400BadRequest, "Bad Request", ex.Message),
                    DbUpdateConcurrencyException ex => (StatusCodes.Status409Conflict, "Conflict", ex.Message),
                    DbUpdateException ex => (StatusCodes.Status409Conflict, "Conflict", ex.Message),
                    _ => (StatusCodes.Status500InternalServerError, "Internal Server Error", "Unexpected server error.")
                };

                context.Response.StatusCode = status;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = status,
                    Title = title,
                    Detail = detail
                });
            });
        });
    }
}
